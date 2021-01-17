const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class CleanHistoryCapability extends Capability {
    /**
     * This function polls the cleaning summary
     *
     * @abstract
     * @returns {Promise<object>}
     */
    async getCleanSummary() {
        throw new NotImplementedError();
    }

    /**
     * This function polls for an individual cleaning record
     *
     * @abstract
     * @param {string} recordId
     * @returns {Promise<object>}
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