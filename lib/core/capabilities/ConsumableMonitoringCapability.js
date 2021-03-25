const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class ConsumableMonitoringCapability extends Capability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../entities/state/attributes/ConsumableStateAttribute")>>}
     */
    async getConsumables() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        throw new NotImplementedError();
    }


    getType() {
        return ConsumableMonitoringCapability.TYPE;
    }
}

ConsumableMonitoringCapability.TYPE = "ConsumableMonitoringCapability";

module.exports = ConsumableMonitoringCapability;
