const TotalStatisticsCapability = require("../../../core/capabilities/TotalStatisticsCapability");

const ValetudoDataPoint = require("../../../entities/core/ValetudoDataPoint");

/**
 * @extends TotalStatisticsCapability<import("../MockValetudoRobot")>
 */
class MockTotalStatisticsCapability extends TotalStatisticsCapability {
    constructor(options) {
        super(options);

        const count = 5;
        this.totalStatistics = {
            time: count * 24 * 60,
            area: count * 63 * 10000,
            count: count
        };
    }

    /**
     * @return {Promise<Array<ValetudoDataPoint>>}
     */
    async getStatistics() {
        return [
            new ValetudoDataPoint({
                type: ValetudoDataPoint.TYPES.TIME,
                value: this.totalStatistics.time
            }),
            new ValetudoDataPoint({
                type: ValetudoDataPoint.TYPES.AREA,
                value: this.totalStatistics.area
            }),
            new ValetudoDataPoint({
                type: ValetudoDataPoint.TYPES.COUNT,
                value: this.totalStatistics.count
            })
        ];
    }

    getProperties() {
        return {
            availableStatistics: [
                ValetudoDataPoint.TYPES.TIME,
                ValetudoDataPoint.TYPES.AREA,
                ValetudoDataPoint.TYPES.COUNT
            ]
        };
    }
}

module.exports = MockTotalStatisticsCapability;
