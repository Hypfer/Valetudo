const FloorMaterialDirectionAwareNavigationControlCapability = require("../../../core/capabilities/FloorMaterialDirectionAwareNavigationControlCapability");

/**
 * @extends FloorMaterialDirectionAwareNavigationControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockFloorMaterialDirectionAwareNavigationControlCapability extends FloorMaterialDirectionAwareNavigationControlCapability {

    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_clean_follow_ground_material_status", [], {});

        return res["status"] === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_clean_follow_ground_material_status", {"status": 1}, {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_clean_follow_ground_material_status", {"status": 0}, {});
    }
}

module.exports = RoborockFloorMaterialDirectionAwareNavigationControlCapability;
