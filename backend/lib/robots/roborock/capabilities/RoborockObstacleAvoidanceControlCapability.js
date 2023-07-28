const ObstacleAvoidanceControlCapability = require("../../../core/capabilities/ObstacleAvoidanceControlCapability");
const RoborockUtils = require("../RoborockUtils");

/**
 * @extends ObstacleAvoidanceControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockObstacleAvoidanceControlCapability extends ObstacleAvoidanceControlCapability {
    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_camera_status", [], {});
        const deserializedRes = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(res);

        return deserializedRes.obstacleAvoidanceEnabled;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const res = await this.robot.sendCommand("get_camera_status", [], {});
        const deserializedRes = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(res);

        deserializedRes.obstacleAvoidanceEnabled = true;

        await this.robot.sendCommand("set_camera_status", [RoborockUtils.SERIALIZE_CAMERA_SETTINGS(deserializedRes)], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const res = await this.robot.sendCommand("get_camera_status", [], {});
        const deserializedRes = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(res);

        deserializedRes.obstacleAvoidanceEnabled = false;

        await this.robot.sendCommand("set_camera_status", [RoborockUtils.SERIALIZE_CAMERA_SETTINGS(deserializedRes)], {});
    }
}

module.exports = RoborockObstacleAvoidanceControlCapability;
