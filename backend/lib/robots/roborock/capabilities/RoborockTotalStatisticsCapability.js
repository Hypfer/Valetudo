const TotalStatisticsCapability = require("../../../core/capabilities/TotalStatisticsCapability");
const ValetudoDataPoint = require("../../../entities/core/ValetudoDataPoint");

/**
 * @extends TotalStatisticsCapability<import("../RoborockValetudoRobot")>
 */
class RoborockTotalStatisticsCapability extends TotalStatisticsCapability {
    /**
     * @return {Promise<Array<ValetudoDataPoint>>}
     */
    async getStatistics() {
        const res = await this.robot.sendCommand("get_clean_summary", [], {});

        // This is how roborock robots before the S7 reported total statistics
        if (Array.isArray(res) && res.length === 4) {
            return [
                new ValetudoDataPoint({
                    type: ValetudoDataPoint.TYPES.TIME,
                    value: res[0]
                }),
                new ValetudoDataPoint({
                    type: ValetudoDataPoint.TYPES.AREA,
                    value: Math.round(res[1] / 100)
                }),
                new ValetudoDataPoint({
                    type: ValetudoDataPoint.TYPES.COUNT,
                    value: res[2]
                })
            ];
        } else if ( //S7 and up
            res &&
            res.clean_time !== undefined &&
            res.clean_area !== undefined &&
            res.clean_count !== undefined
        ) {
            return [
                new ValetudoDataPoint({
                    type: ValetudoDataPoint.TYPES.TIME,
                    value: res.clean_time
                }),
                new ValetudoDataPoint({
                    type: ValetudoDataPoint.TYPES.AREA,
                    value: Math.round(res.clean_area / 100)
                }),
                new ValetudoDataPoint({
                    type: ValetudoDataPoint.TYPES.COUNT,
                    value: res.clean_count
                })
            ];
        } else {
            throw new Error("Received invalid response");
        }
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

module.exports = RoborockTotalStatisticsCapability;
