const Capability = require("./Capability");
const ConsumableDepletedValetudoEvent = require("../../valetudo_events/events/ConsumableDepletedValetudoEvent");
const NotImplementedError = require("../NotImplementedError");
const ValetudoConsumable = require("../../entities/core/ValetudoConsumable");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class ConsumableMonitoringCapability extends Capability {
    /**
     * This function polls the current consumables state
     *
     * @abstract
     * @returns {Promise<Array<ValetudoConsumable>>}
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

    // FIXME: Nothing will raise these events if MQTT isn't active, because nothing will periodically poll the capability
    /**
     * @protected
     * @param {Array<ValetudoConsumable>} consumables
     */
    raiseEventIfRequired(consumables) {
        consumables.forEach(consumable => {
            if (consumable?.remaining?.value === 0) {
                this.robot.valetudoEventStore.raise(new ConsumableDepletedValetudoEvent({
                    type: consumable.type,
                    subType: consumable.subType
                }));
            }
        });
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
     * @return {{availableConsumables: Array<ConsumableMeta>}}
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

/**
 * @typedef {object} ConsumableMeta
 *
 * @property {ValetudoConsumable.TYPE} type
 * @property {ValetudoConsumable.SUB_TYPE} subType
 * @property {ValetudoConsumable.UNITS} unit
 * @property {number} [maxValue]
 * 
 */


ConsumableMonitoringCapability.TYPE = "ConsumableMonitoringCapability";

module.exports = ConsumableMonitoringCapability;
