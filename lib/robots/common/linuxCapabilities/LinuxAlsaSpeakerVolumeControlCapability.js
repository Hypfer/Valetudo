const NotImplementedError = require("../../../core/NotImplementedError");
const spawnSync = require("child_process").spawnSync;
const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

class LinuxAlsaSpeakerVolumeControlCapability extends SpeakerVolumeControlCapability {
    /**
     * If the sound card you need to control is not the default one, you need to return the correct card name.
     * You can retrieve it with "aplay -l", it's the string right after the card number, in this case it is
     * "audiocodec":
     *
     * **** List of PLAYBACK Hardware Devices ****
     *         vvvvvvvvvv
     * card 0: audiocodec [audiocodec], device 0: SUNXI-CODEC sndcodec-0 []
     *         ^^^^^^^^^^
     *   Subdevices: 1/1
     *   Subdevice #0: subdevice #0
     *
     *
     * @returns {string|null}
     */
    getAlsaSoundCardName() {
        return null;
    }

    /**
     * This method must be overridden to return the sound control name. To retrieve it, run alsamixer, hover the
     * control that you want to use, then on the top of the window you will see "Item:" followed by your string.
     * If you're having issues you can also run `amixer controls` to get the full list of controls.
     *
     * @abstract
     * @returns {string}
     */
    getAlsaControlName() {
        throw new NotImplementedError();
    }

    /**
     * Whether the control or the kernel's ALSA subsystem supports mute. You can find this out in the following ways:
     * - In alsamixer, pressing M should mute the control
     * - Running `amixer --card CARDNAME set CONTROLNAME mute` (or unmute) should do something
     * - Running `amixer --card CARDNAME get CONTROLNAME` will say `[on]` or `[off]` next to the volume levels
     * By default it assumes mute support is not available.
     *
     * @returns {boolean}
     */
    getAlsaMuteSupported() {
        return false;
    }

    /**
     * Runs amixer with the configured options to retrieve volume + mute state.
     *
     * @returns {{volume: number, mute: boolean}}
     */
    getAlsaVolume() {
        const volumeRegex = /\w+:.+\d+\s+\[(\d+)%]/;
        const muteRegex = /\w+:.+\d+\s+\[\d+%]\s+\[(\w+)]/;

        const soundcard = this.getAlsaSoundCardName();
        const muteSupported = this.getAlsaMuteSupported();

        let args = ["get", this.getAlsaControlName()];
        if (soundcard !== null) {
            // @ts-ignore
            args = ["--card", soundcard].concat(args);
        }

        // @ts-ignore
        const amixer = spawnSync("amixer", args);
        if (amixer.status !== 0) {
            throw new Error("Failed to retrieve volume level");
        }

        let levelCount = 0;
        // TODO: Find ES2019 alternative to matchAll
        // @ts-ignore
        const volume = amixer.stdout.matchAll(volumeRegex)
            .map((match) => {
                return parseInt(match[1]);
            })
            .reduce((accumulator, pilot) => {
                levelCount++;
                return (accumulator * (levelCount - 1) + pilot) * levelCount;
            }, 0);

        let mute;
        if (muteSupported) {
            // TODO: Find ES2019 alternative to matchAll
            // @ts-ignore
            mute = amixer.stdout.matchAll(muteRegex)
                .map((match) => {
                    return match[1] === "off";
                })
                .reduce((accumulator, pilot) => {
                    // If at least one of the channels is not muted we consider it not muted
                    return accumulator && pilot;
                }, true);
        } else {
            mute = volume === 0;
        }

        return {
            volume: volume,
            mute: mute
        };
    }

    /**
     * Runs amixer to set the volume.
     *
     * @param {string|number} value
     */
    setAlsaVolume(value) {
        const soundcard = this.getAlsaSoundCardName();
        const muteSupported = this.getAlsaMuteSupported();

        // Store/retrieve current volume level for later unmuting, if native muting is not supported
        if (!muteSupported) {
            if (value === "mute") {
                this.unmuteLevel = this.getAlsaVolume().volume;
            } else if (value === "unmute") {
                if (this.unmuteLevel === undefined || this.unmuteLevel === 0) {
                    this.unmuteLevel = 100;
                }
            }
        }

        // Generate appropriate amixer argument based on the requested action
        let generatedValue;
        if (value === "mute" || value === "unmute") {
            if (muteSupported) {
                generatedValue = value;
            } else {
                generatedValue = value === "mute" ? 0 : this.unmuteLevel;
            }
        } else {
            generatedValue = value + "%";
        }

        let args = ["set", this.getAlsaControlName(), generatedValue];
        if (soundcard !== null) {
            // @ts-ignore
            args = ["--card", soundcard].concat(args);
        }

        // @ts-ignore
        const amixer = spawnSync("amixer", args);
        if (amixer.status !== 0) {
            throw new Error("Failed to set volume level");
        }
    }

    /**
     * Returns the current voice volume as percentage
     *
     * @abstract
     * @returns {Promise<number>}
     */
    async getVolume() {
        return this.getAlsaVolume().volume;
    }

    /**
     * Sets the speaker volume
     *
     * @abstract
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setVolume(value) {
        this.setAlsaVolume(value);
    }
}

module.exports = LinuxAlsaSpeakerVolumeControlCapability;
