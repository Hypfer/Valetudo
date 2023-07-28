const PetObstacleAvoidanceControlCapability = require("../../../core/capabilities/PetObstacleAvoidanceControlCapability");
const RoborockUtils = require("../RoborockUtils");

/**
 * @extends PetObstacleAvoidanceControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockPetObstacleAvoidanceControlCapability extends PetObstacleAvoidanceControlCapability {
    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const res = await this.robot.sendCommand("get_camera_status", [], {});
        const deserializedRes = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(res);

        return deserializedRes.petObstacleAvoidanceEnabled;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const res = await this.robot.sendCommand("get_camera_status", [], {});
        const deserializedRes = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(res);

        deserializedRes.petObstacleAvoidanceEnabled = true;

        await this.robot.sendCommand("set_camera_status", [RoborockUtils.SERIALIZE_CAMERA_SETTINGS(deserializedRes)], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const res = await this.robot.sendCommand("get_camera_status", [], {});
        const deserializedRes = RoborockUtils.DESERIALIZE_CAMERA_SETTINGS(res);

        deserializedRes.petObstacleAvoidanceEnabled = false;

        await this.robot.sendCommand("set_camera_status", [RoborockUtils.SERIALIZE_CAMERA_SETTINGS(deserializedRes)], {});
    }
}

module.exports = RoborockPetObstacleAvoidanceControlCapability;
