const StatusLEDControlCapability = require("../../../core/capabilities/StatusLEDControlCapability");

/**
 * @extends StatusLEDControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockStatusLEDControlCapability extends StatusLEDControlCapability {

    /**
     * This function polls the current key lock state
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_flow_led_status", [], {});

        return res.status === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_flow_led_status", {status: 1}, {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_flow_led_status", {status: 0}, {});
    }
}

module.exports = RoborockStatusLEDControlCapability;
