const entities = require("../../../entities");
const MopDockDryManualTriggerCapability = require("../../../core/capabilities/MopDockDryManualTriggerCapability");

/**
 * @extends MopDockDryManualTriggerCapability<import("../MockValetudoRobot")>
 */
class MockMopDockDryManualTriggerCapability extends MopDockDryManualTriggerCapability {
    /**
     * @returns {Promise<void>}
     */
    async startDrying() {
        this.robot.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.DRYING
        }));
    }

    /**
     * @returns {Promise<void>}
     */
    async stopDrying() {
        this.robot.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
            value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
        }));
    }
}

module.exports = MockMopDockDryManualTriggerCapability;
