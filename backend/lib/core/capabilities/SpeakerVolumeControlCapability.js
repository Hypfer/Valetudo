const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class SpeakerVolumeControlCapability extends Capability {
    /**
     * Returns the current voice volume as percentage
     *
     * @abstract
     * @returns {Promise<number>}
     */
    async getVolume() {
        throw new NotImplementedError();
    }

    /**
     * Sets the speaker volume
     *
     * @abstract
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setVolume(value) {
        throw new NotImplementedError();
    }

    getType() {
        return SpeakerVolumeControlCapability.TYPE;
    }
}

SpeakerVolumeControlCapability.TYPE = "SpeakerVolumeControlCapability";

module.exports = SpeakerVolumeControlCapability;
