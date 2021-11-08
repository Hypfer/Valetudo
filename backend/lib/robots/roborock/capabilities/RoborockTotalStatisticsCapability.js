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

        if (!(Array.isArray(res) && res.length === 4)) {
            throw new Error("Received invalid response");
        }


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
    }
}

module.exports = RoborockTotalStatisticsCapability;
