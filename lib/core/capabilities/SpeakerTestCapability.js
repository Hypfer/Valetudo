const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");


/*
    Plays some kind of sound to test the current audio volume
 */
class SpeakerTestCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async playTestSound() {
        throw new NotImplementedError();
    }

    getType() {
        return SpeakerTestCapability.TYPE;
    }
}

SpeakerTestCapability.TYPE = "SpeakerTestCapability";

module.exports = SpeakerTestCapability;
