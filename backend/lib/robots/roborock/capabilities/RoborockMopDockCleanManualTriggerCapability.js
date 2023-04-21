const MopDockCleanManualTriggerCapability = require("../../../core/capabilities/MopDockCleanManualTriggerCapability");

/**
 * @extends MopDockCleanManualTriggerCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMopDockCleanManualTriggerCapability extends MopDockCleanManualTriggerCapability {
    async startCleaning() {
        await this.robot.sendCommand("app_start_wash", [], {});
    }

    async stopCleaning() {
        await this.robot.sendCommand("app_stop_wash", [], {});
    }
}

module.exports = RoborockMopDockCleanManualTriggerCapability;
