const CurrentStatisticsCapability = require("../../../core/capabilities/CurrentStatisticsCapability");
const ValetudoDataPoint = require("../../../entities/core/ValetudoDataPoint");

/**
 * @extends CurrentStatisticsCapability<import("../RoborockValetudoRobot")>
 */
class RoborockCurrentStatisticsCapability extends CurrentStatisticsCapability {
    /**
     * @param {object} options
     * @param {import("../RoborockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.currentStatistics = {
            time: undefined,
            area: undefined
        };
    }

    /**
     * @return {Promise<Array<ValetudoDataPoint>>}
     */
    async getStatistics() {
        if (this.currentStatistics.time === undefined || this.currentStatistics.area === undefined ){
            await this.robot.pollState(); //fetching robot state populates the capability's internal state. somewhat spaghetti :(
        }

        return [
            new ValetudoDataPoint({
                type: ValetudoDataPoint.TYPES.TIME,
                value: this.currentStatistics.time
            }),
            new ValetudoDataPoint({
                type: ValetudoDataPoint.TYPES.AREA,
                value: this.currentStatistics.area
            })
        ];
    }
}

module.exports = RoborockCurrentStatisticsCapability;
