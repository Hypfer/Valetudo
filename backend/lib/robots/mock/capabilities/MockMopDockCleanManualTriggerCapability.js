const entities = require("../../../entities");
const MopDockCleanManualTriggerCapability = require("../../../core/capabilities/MopDockCleanManualTriggerCapability");

/**
 * @extends MopDockCleanManualTriggerCapability<import("../MockValetudoRobot")>
 */
class MockMopDockCleanManualTriggerCapability extends MopDockCleanManualTriggerCapability {
    /**
     * @returns {Promise<void>}
     */
    async startCleaning() {
        this.robot.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.CLEANING
        }));
    }

    /**
     * @returns {Promise<void>}
     */
    async stopCleaning() {
        this.robot.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
        }));
    }
}

module.exports = MockMopDockCleanManualTriggerCapability;
