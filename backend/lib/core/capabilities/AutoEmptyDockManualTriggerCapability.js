const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 *
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class AutoEmptyDockManualTriggerCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async triggerAutoEmpty() {
        throw new NotImplementedError();
    }

    getType() {
        return AutoEmptyDockManualTriggerCapability.TYPE;
    }
}

AutoEmptyDockManualTriggerCapability.TYPE = "AutoEmptyDockManualTriggerCapability";

module.exports = AutoEmptyDockManualTriggerCapability;
