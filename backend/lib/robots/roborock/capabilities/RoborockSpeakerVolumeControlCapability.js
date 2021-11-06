const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

/**
 * @extends SpeakerVolumeControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockSpeakerVolumeControlCapability extends SpeakerVolumeControlCapability {
    /**
     * Returns the current voice volume as percentage
     *
     * @returns {Promise<number>}
     */
    async getVolume() {
        const res = await this.robot.sendCommand("get_sound_volume", [], {});

        return res[0];
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
