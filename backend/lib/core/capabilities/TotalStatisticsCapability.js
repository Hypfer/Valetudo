const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");
const ValetudoDataPoint = require("../../entities/core/ValetudoDataPoint");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class TotalStatisticsCapability extends Capability {
    /**
     * The amount and type of stuff returned here depends on the robots implementation
     *
     * @return {Promise<Array<ValetudoDataPoint>>}
     */
    async getStatistics() {
        throw new NotImplementedError();
    }

    getType() {
        return TotalStatisticsCapability.TYPE;
    }

    /**
     * @return {{availableStatistics: Array<ValetudoDataPoint.TYPES>}}
     */
    getProperties() {
        return {
            availableStatistics: []
        };
    }
}

TotalStatisticsCapability.TYPE = "TotalStatisticsCapability";

module.exports = TotalStatisticsCapability;
