const MopDockMopAutoDryingControlCapability = require("../../../core/capabilities/MopDockMopAutoDryingControlCapability");

/**
 * @extends MopDockMopAutoDryingControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMopDockMopAutoDryingControlCapability extends MopDockMopAutoDryingControlCapability {
    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("app_get_dryer_setting", [], {});

        return res["status"] === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        /*
        const config = {
            "status": val,
            "on":  { "cliff_on": 1000, "cliff_off": 1000 },
            "off": { "cliff_on":  500, "cliff_off":  500 },
        };
        return this.robot.sendCommand("app_set_dryer_setting", config, {});
        */
        await this.robot.sendCommand("app_set_dryer_setting", {"status": 1}, {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("app_set_dryer_setting", {"status": 0}, {});
    }
}

module.exports = RoborockMopDockMopAutoDryingControlCapability;
