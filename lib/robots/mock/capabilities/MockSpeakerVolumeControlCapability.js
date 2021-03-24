const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

/**
 * @extends SpeakerVolumeControlCapability<import("../MockRobot")>
 */
class MockSpeakerVolumeControlCapability extends SpeakerVolumeControlCapability {
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
