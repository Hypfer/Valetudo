const CleanHistoryCapability = require("../../../core/capabilities/CleanHistoryCapability");

class RoborockCleanHistoryCapability extends CleanHistoryCapability {
    /**
     * This function polls the cleaning summary and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Object>}
     */
    async getCleanSummary() {
        const data = await this.robot.sendCommand("get_clean_summary", [], {});

        const CleanSummary = 
            new Object({
                area: {
                    value: (data[1] / 1000000),
                    unit: "SQUARE_METRES"
                },
                hours: {
                    value: Math.round(data[0] / 60),
                    unit: "MINUTES"
                },
                count: {
                    value: data[2]
                },
                lastRuns: data[3]
            });

        return CleanSummary;
    }

    /**
     * This function polls for an individual cleaning record
     *
     * @abstract
     * @returns {Promise<Object>}
     */
    async getCleanRecord(recordId) {

        const data = await this.robot.sendCommand("get_clean_record", [parseInt(recordId)], {});
        const timeZone = await this.robot.sendCommand("get_timezone", [], {});

        const CleanRecord = 
            new Object({
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
                    unit: "SECONDS"
                },
                area: {
                    value: (data[0][3] / 1000000),
                    unit: "SQUARE_METRES"
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