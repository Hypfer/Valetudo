const JobHistoryCapability = require("../../../core/capabilities/JobHistoryCapability");

const Job = require("../../../entities/job/Job");
const HistoryJobAttribute = require("../../../entities/job/attributes/HistoryJobAttribute");
const StatisticsJobAttribute = require("../../../entities/job/attributes/StatisticsJobAttribute");
const ErrorJobAttribute = require("../../../entities/job/attributes/ErrorJobAttribute");

class RoborockJobHistoryCapability extends JobHistoryCapability {
    /**
     * This function polls the job summary and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<Job>>}
     */
    async getJobSummary() {
        const data = await this.robot.sendCommand("get_clean_summary", [], {});

        const jobSummary = [
            new Job({
                type: Job.TYPE.SUMMARY,
                state: null,
                action: Job.ACTION.VACUUM,
                count: data[2],
                attributes: [
                    new StatisticsJobAttribute({
                        type: StatisticsJobAttribute.TYPE.DURATION,
                        value: data[0] / 60
                    }),
                    new StatisticsJobAttribute({
                        type: StatisticsJobAttribute.TYPE.AREA,
                        value: data[1] / 100
                    }),
                ]
            })];
            data[3].forEach(e => {
                jobSummary.push(new Job({
                    type: Job.TYPE.COMPLETED,
                    state: null,
                    action: Job.ACTION.VACUUM,
                    id: e,
                    attributes: null
                }));
            });

        return jobSummary;
    }

    /**
     * This function polls for an individual job record
     *
     * @abstract
     * @param {number} recordId
     * @returns {Promise<Job>}
     */
    async getJobRecord(recordId) {

        const data = await this.robot.sendCommand("get_clean_record", [recordId], {});

        const jobRecord = new Job ({
            type: Job.TYPE.COMPLETED,
            state: (data[0][5] === 1 ? Job.STATE.SUCCESSFUL: (data[0][4] === 0 ? Job.STATE.CANCELLED : Job.STATE.FAILED)),
            action: Job.ACTION.VACUUM,
            id: recordId,
            attributes: [
                new HistoryJobAttribute({
                    start: new Date(data[0][0] * 1000),
                    end: new Date(data[0][1] * 1000)
                }),
                new StatisticsJobAttribute({
                    type: StatisticsJobAttribute.TYPE.DURATION,
                    value: data[0][2]
                }),
                new StatisticsJobAttribute({
                    type: StatisticsJobAttribute.TYPE.AREA,
                    value: data[0][3] / 100
                }),
                new ErrorJobAttribute({
                    code: data[0][4],
                    description: this.robot.getErrorCodeDescription(data[0][4])
                })
            ]
        });

        return jobRecord;
    }
}

module.exports = RoborockJobHistoryCapability;