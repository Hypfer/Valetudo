const CleanHistoryCapability = require("../../../core/capabilities/CleanHistoryCapability");

const CleanSummaryAttribute = require("../../../entities/state/attributes/CleanSummaryAttribute");

const CleanRecordAttribute = require("../../../entities/state/attributes/CleanRecordAttribute");
const { utimesSync } = require("fs");

class RoborockCleanHistoryCapability extends CleanHistoryCapability {
    /**
     * This function polls the cleaning summary and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<import("../../../entities/state/attributes/CleanSummaryAttribute")>}
     */
    async getCleanSummary() {
        const data = await this.robot.sendCommand("get_clean_summary", [], {});

        const CleanSummary = 
            new CleanSummaryAttribute({
                area: {
                    value: (data[1] / 1000000),
                    unit: CleanSummaryAttribute.UNITS.SQUARE_METRES
                },
                hours: {
                    value: Math.round(data[0] / 60),
                    unit: CleanSummaryAttribute.UNITS.MINUTES
                },
                count: {
                    value: data[2]
                },
                lastRuns: data[3]
            });

        this.robot.state.upsertFirstMatchingAttribute(CleanSummary);

        this.robot.emitStateUpdated();

        return CleanSummary;
    }

    /**
     * This function polls for an individual cleaning record
     *
     * @abstract
     * @returns {Promise<import("../../../entities/state/attributes/CleanRecordAttribute")>}
     */
    async getCleanRecord(recordId) {

        const data = await this.robot.sendCommand("get_clean_record", [parseInt(recordId)], {});
        const timeZone = await this.robot.sendCommand("get_timezone", [], {});

        const CleanRecord = 
            new CleanRecordAttribute({
                startTime: {
                    epoch: data[0][0],
                    utc: new Date(data[0][0] * 1000),
                    local: new Date(data[0][0] * 1000).toLocaleString(undefined, {timeZone: timeZone})
                },
                finishTime: {
                    epoch: data[0][1],
                    utc: new Date(data[0][1] * 1000),
                    local: new Date(data[0][0] * 1000).toLocaleString(undefined, {timeZone: timeZone})
                },
                duration: {
                    value: data[0][2],
                    unit: CleanRecordAttribute.UNITS.SECONDS
                },
                area: {
                    value: (data[0][3] / 1000000),
                    unit: CleanRecordAttribute.UNITS.SQUARE_METRES
                },
                error: {
                    code: data[0][4],
                    description: "" //TOOD this.robot.GET_ERROR_CODE_DESCRIPTION(data[0][4])
                },
                finishedFlag: (data[0][5] === 1)
            });

        return CleanRecord;
    }
}

module.exports = RoborockCleanHistoryCapability;