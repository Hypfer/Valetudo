const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class CameraLightControlCapability extends SimpleToggleCapability {
    getType() {
        return CameraLightControlCapability.TYPE;
    }
}

CameraLightControlCapability.TYPE = "CameraLightControlCapability";

module.exports = CameraLightControlCapability;
