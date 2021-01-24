const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

class RoborockSpeakerVolumeControlCapability extends SpeakerVolumeControlCapability {
    /**
     * Returns the current voice volume as percentage
     *
     * @abstract
     * @returns {Promise<number>}
     */
    async getSpeakerVolumePercent() {
        return await this.robot.sendCommand("get_sound_volume", [], {});
    }

    /**
     * Returns whether the voice is muted.
     *
     * @abstract
     * @returns {Promise<boolean>}
     */
    async getSpeakerMute() {
        const res = await this.robot.sendCommand("get_sound_volume", [], {});

        return (parseInt(res[0]) > 0 ? false : true);
    }

    /**
     * Sets the speaker volume
     *
     * @abstract
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setSpeakerVolumePercent(value) {
        return await this.robot.sendCommand("change_sound_volume", [value], {});
    }

    /**
     * Mutes/unmutes the robot's voice
     *
     * @abstract
     * @param {boolean} mute
     * @returns {Promise<void>}
     */
    async setSpeakerMute(mute) {
        if (mute === true) {
            return await this.robot.sendCommand("change_sound_volume", [0], {});
        } else {
            return await this.robot.sendCommand("change_sound_volume", [100], {});
        }
    }

    /**
     * Tests the robot's voice volume by playing a sound
     *
     * @abstract
     * @returns {Promise<void>}
     */
    async testSpeaker() {
        return await this.robot.sendCommand("test_sound_volume", [], {});
    }
}

module.exports = RoborockSpeakerVolumeControlCapability;