const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

class RoborockSpeakerVolumeControlCapability extends SpeakerVolumeControlCapability {
    /**
     * Returns the current voice volume as percentage
     *
     * @returns {Promise<number>}
     */
    async getVolume() {
        return this.robot.sendCommand("get_sound_volume", [], {});
    }

    /**
     * Sets the speaker volume
     *
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setVolume(value) {
        await this.robot.sendCommand("change_sound_volume", [value], {});
    }
}

module.exports = RoborockSpeakerVolumeControlCapability;
