const Capability = require("./Capability");
const ConsumableStateAttribute = require("../../entities/state/attributes/ConsumableStateAttribute");
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
     * @returns {Promise<Array<ConsumableStateAttribute>>}
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

    /**
     * This utility method should be called on reset by each implementation to make sure
     * that there are no stale events when resetting the consumable via other ways
     *
     * @protected
     * @param {string} type
     * @param {string} [subType]
     */
    markEventsAsProcessed(type, subType) {
        try {
            this.robot.valetudoEventStore.setProcessed(`consumable_depleted_${type}_${subType}`);
        } catch (e) {
            //intentional
        }
    }

    /**
     *
     * @return {{availableConsumables: Array<{type: ConsumableStateAttribute.TYPE, subType: ConsumableStateAttribute.SUB_TYPE, unit: ConsumableStateAttribute.UNITS}>}}
     */
    getProperties() {
        return {
            availableConsumables: []
        };
    }


    getType() {
        return ConsumableMonitoringCapability.TYPE;
    }
}


ConsumableMonitoringCapability.TYPE = "ConsumableMonitoringCapability";

module.exports = ConsumableMonitoringCapability;
