const ButtonLightsControlCapability = require("../../../core/capabilities/ButtonLightsControlCapability");

/**
 * @extends ButtonLightsControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockButtonLightsControlCapability extends ButtonLightsControlCapability {

    /**
     * This function polls the current key lock state
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_led_status", [], {});

        return res[0] === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_led_status", [1], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_led_status", [0], {});
    }
}

module.exports = RoborockButtonLightsControlCapability;
