const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class CleanHistoryCapability extends Capability {
    /**
     * This function polls the cleaning summary
     *
     * @abstract
     * @returns {Promise<Object>}
     */
    async getCleanSummary() {
        throw new NotImplementedError();
    }

    /**
     * This function polls for an individual cleaning record
     *
     * @abstract
     * @returns {Promise<Object>}
     */
    async getCleanRecord(recordId) {
        throw new NotImplementedError();
    }

    getType() {
        return CleanHistoryCapability.TYPE;
    }
}

CleanHistoryCapability.TYPE = "CleanHistoryCapability";

module.exports = CleanHistoryCapability;