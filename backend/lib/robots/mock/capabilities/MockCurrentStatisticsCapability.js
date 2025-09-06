const CurrentStatisticsCapability = require("../../../core/capabilities/CurrentStatisticsCapability");
const ValetudoDataPoint = require("../../../entities/core/ValetudoDataPoint");

/**
 * @extends CurrentStatisticsCapability<import("../MockValetudoRobot")>
 */
class MockCurrentStatisticsCapability extends CurrentStatisticsCapability {
    /**
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.currentStatistics = {
            time: 24*60,
            area: 63*10000
        };
    }

    /**
     * @return {Promise<Array<ValetudoDataPoint>>}
     */
    async getStatistics() {
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

module.exports = MockCurrentStatisticsCapability;
