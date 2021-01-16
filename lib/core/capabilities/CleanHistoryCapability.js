const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class CleanHistoryCapability extends Capability {
    /**
     * This function polls the cleaning summary
     *
     * @abstract
     * @returns {Promise<import("../../entities/state/attributes/CleanSummaryAttribute")>}
     */
    async getCleanSummary() {
        throw new NotImplementedError();
    }

    /**
     * This function polls for an individual cleaning record
     *
     * @abstract
     * @returns {Promise<import("../../entities/state/attributes/CleanRecordAttribute")>}
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