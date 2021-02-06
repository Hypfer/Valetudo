const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class JobHistoryCapability extends Capability {
    /**
     * This function polls the job summary
     *
     * @abstract
     * @returns {Promise<Array<import("../../entities/job/Job")>>}
     */
    async getJobSummary() {
        throw new NotImplementedError();
    }

    /**
     * This function polls for an individual job record
     *
     * @abstract
     * @param {number} recordId
     * @returns {Promise<import("../../entities/job/Job")>}
     */
    async getJobRecord(recordId) {
        throw new NotImplementedError();
    }

    getType() {
        return JobHistoryCapability.TYPE;
    }
}

JobHistoryCapability.TYPE = "JobHistoryCapability";

module.exports = JobHistoryCapability;