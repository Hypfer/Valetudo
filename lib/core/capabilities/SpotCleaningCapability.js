const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class SpotCleaningCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async spotClean() {
        throw new NotImplementedError();
    }

    getType() {
        return SpotCleaningCapability.TYPE;
    }
}

SpotCleaningCapability.TYPE = "SpotCleaningCapability";

module.exports = SpotCleaningCapability;