const KeyLockCapability = require("../../../core/capabilities/KeyLockCapability");

/**
 * @extends KeyLockCapability<import("../RoborockValetudoRobot")>
 */
class RoborockKeyLockCapability extends KeyLockCapability {

    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_child_lock_status", [], {});

        return res["lock_status"] === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_child_lock_status", {"lock_status": 1}, {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_child_lock_status", {"lock_status": 0}, {});
    }
}

module.exports = RoborockKeyLockCapability;
