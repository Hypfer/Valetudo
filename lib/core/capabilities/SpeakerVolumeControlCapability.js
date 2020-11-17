const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class SpeakerVolumeControlCapability extends Capability {
    /**
     * Returns the current voice volume as percentage
     *
     * @abstract
     * @returns {Promise<number>}
     */
    async getSpeakerVolumePercent() {
        throw new NotImplementedError();
    }

    /**
     * Returns whether the voice is muted.
     *
     * @abstract
     * @returns {Promise<boolean>}
     */
    async getSpeakerMute() {
        throw new NotImplementedError();
    }

    /**
     * Sets the speaker volume
     *
     * @abstract
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setSpeakerVolumePercent(value) {
        throw new NotImplementedError();
    }

    /**
     * Mutes/unmutes the robot's voice
     *
     * @abstract
     * @param {boolean} mute
     * @returns {Promise<void>}
     */
    async setSpeakerMute(mute) {
        throw new NotImplementedError();
    }

    getType() {
        return SpeakerVolumeControlCapability.TYPE;
    }
}

SpeakerVolumeControlCapability.TYPE = "SpeakerVolumeControlCapability";

module.exports = SpeakerVolumeControlCapability;