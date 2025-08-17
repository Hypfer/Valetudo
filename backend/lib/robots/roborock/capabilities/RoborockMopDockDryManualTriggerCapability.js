const MopDockDryManualTriggerCapability = require("../../../core/capabilities/MopDockDryManualTriggerCapability");

/**
 * @extends MopDockDryManualTriggerCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMopDockDryManualTriggerCapability extends MopDockDryManualTriggerCapability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async startDrying() {
        await this.robot.sendCommand("app_set_dryer_status", { "status": 1 }, {});
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async stopDrying() {
        await this.robot.sendCommand("app_set_dryer_status", { "status": 0 }, {});
    }
}

module.exports = RoborockMopDockDryManualTriggerCapability;
