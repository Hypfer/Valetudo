const CurrentStatisticsCapability = require("../../../core/capabilities/CurrentStatisticsCapability");
const ValetudoDataPoint = require("../../../entities/core/ValetudoDataPoint");

/**
 * @extends CurrentStatisticsCapability<import("../MideaValetudoRobot")>
 */
class MideaCurrentStatisticsCapability extends CurrentStatisticsCapability {
    /**
     * @param {object} options
     * @param {import("../MideaValetudoRobot")} options.robot
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
        await this.robot.pollState(); //fetching robot state populates the capability's internal state. somewhat spaghetti :(

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

    getProperties() {
        return {
            availableStatistics: [
                ValetudoDataPoint.TYPES.TIME,
                ValetudoDataPoint.TYPES.AREA
            ]
        };
    }
}

module.exports = MideaCurrentStatisticsCapability;
