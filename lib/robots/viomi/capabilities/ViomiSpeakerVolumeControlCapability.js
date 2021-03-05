const LinuxAlsaSpeakerVolumeControlCapability = require("../../common/linuxCapabilities/LinuxAlsaSpeakerVolumeControlCapability");

class ViomiSpeakerVolumeControlCapability extends LinuxAlsaSpeakerVolumeControlCapability {
    /**
     * Returns the current voice volume as percentage
     *
     * @returns {Promise<number>}
     */
    async getVolume() {
        if (this.robot.config.get("embedded") === true) {
            return await super.getVolume();
        }

        // This could be added to the polled state attributes but there's no reason to waste bandwidth and retrieve it
        // all the time
        const result = await this.robot.sendCommand("get_prop", ["v_state"], {});
        // noinspection JSUnresolvedVariable
        if (result.length < 1) {
            throw new Error("Invalid volume returned by vacuum");
        }

        return result[0] * 10;
    }

    /**
     * Sets the speaker volume
     *
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setVolume(value) {
        const viomifiedVolume = Math.round(value / 10);
        const args = [value === 0 ? 0 : 1, viomifiedVolume];

        // First set the volume using miIO, so the vacum stores the value
        await this.robot.sendCommand("set_voice", args, {});

        if (this.robot.config.get("embedded") === true && value % 10 !== 0) {
            // Then also adjust it with ALSA to get finer control
            await super.setVolume(value);
        }
    }

    getAlsaControlName() {
        return "Lineout volume control";
    }
}

module.exports = ViomiSpeakerVolumeControlCapability;
