const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

/**
 * @extends SpeakerVolumeControlCapability<import("../MockValetudoRobot")>
 */
class MockSpeakerVolumeControlCapability extends SpeakerVolumeControlCapability {
    /**
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);
        this.volume = 80;
    }

    /**
     * Returns the current voice volume as percentage
     *
     * @returns {Promise<number>}
     */
    async getVolume() {
        return this.volume;
    }

    /**
     * Sets the speaker volume
     *
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setVolume(value) {
        this.volume = value;
    }
}

module.exports = MockSpeakerVolumeControlCapability;
