const CollisionAvoidantNavigationControlCapability = require("../../../core/capabilities/CollisionAvoidantNavigationControlCapability");

/**
 * @extends CollisionAvoidantNavigationControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockCollisionAvoidantNavigationControlCapability extends CollisionAvoidantNavigationControlCapability {

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_collision_avoid_status", [], {});

        return res["status"] === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_collision_avoid_status", {"status": 1}, {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_collision_avoid_status", {"status": 0}, {});
    }
}

module.exports = RoborockCollisionAvoidantNavigationControlCapability;
