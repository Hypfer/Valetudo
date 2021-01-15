const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class CleanSummaryCapability extends Capability {
    /**
     * This function polls the cleaning summary and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<import("../../entities/state/attributes/CleanSummaryAttribute")>}
     */
    async getCleanSummary() {
        throw new NotImplementedError();
    }

    getType() {
        return CleanSummaryCapability.TYPE;
    }
}

CleanSummaryCapability.TYPE = "CleanSummaryCapability";

module.exports = CleanSummaryCapability;