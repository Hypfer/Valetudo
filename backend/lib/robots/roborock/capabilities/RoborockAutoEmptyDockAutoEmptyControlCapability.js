const AutoEmptyDockAutoEmptyControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyControlCapability");

/**
 * @extends AutoEmptyDockAutoEmptyControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockAutoEmptyDockAutoEmptyControlCapability extends AutoEmptyDockAutoEmptyControlCapability {
    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_dust_collection_switch_status", [], {});
        return res.status === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_dust_collection_switch_status", { "status": 1 }, {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_dust_collection_switch_status", { "status": 0 }, {});
    }
}

module.exports = RoborockAutoEmptyDockAutoEmptyControlCapability;
