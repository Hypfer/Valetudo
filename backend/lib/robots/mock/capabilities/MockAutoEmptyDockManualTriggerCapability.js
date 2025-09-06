const AutoEmptyDockManualTriggerCapability = require("../../../core/capabilities/AutoEmptyDockManualTriggerCapability");
const Logger = require("../../../Logger");

/**
 * @extends AutoEmptyDockManualTriggerCapability<import("../MockValetudoRobot")>
 */
class MockAutoEmptyDockManualTriggerCapability extends AutoEmptyDockManualTriggerCapability {
    /**
     * @returns {Promise<void>}
     */
    async triggerAutoEmpty() {
        Logger.info("Auto Empty Dock Auto Empty triggered manually");
    }
}

module.exports = MockAutoEmptyDockManualTriggerCapability;
