const IntensiveMoppingPathControlCapability = require("../../../core/capabilities/IntensiveMoppingPathControlCapability");

/**
 * @extends IntensiveMoppingPathControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockIntensiveMoppingPathControlCapability extends IntensiveMoppingPathControlCapability {

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_mop_mode", [], {});

        return res?.[0] === 301;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_mop_mode", [301], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_mop_mode", [300], {});
    }
}

module.exports = RoborockIntensiveMoppingPathControlCapability;
