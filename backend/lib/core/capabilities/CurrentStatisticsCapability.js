const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");
const ValetudoDataPoint = require("../../entities/core/ValetudoDataPoint");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class CurrentStatisticsCapability extends Capability {
    /**
     * The amount and type of stuff returned here depends on the robots implementation
     *
     * @return {Promise<Array<ValetudoDataPoint>>}
     */
    async getStatistics() {
        throw new NotImplementedError();
    }

    getType() {
        return CurrentStatisticsCapability.TYPE;
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

CurrentStatisticsCapability.TYPE = "CurrentStatisticsCapability";

module.exports = CurrentStatisticsCapability;
