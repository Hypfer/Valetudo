const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class FloorMaterialDirectionAwareNavigationControlCapability extends SimpleToggleCapability {
    getType() {
        return FloorMaterialDirectionAwareNavigationControlCapability.TYPE;
    }
}

FloorMaterialDirectionAwareNavigationControlCapability.TYPE = "FloorMaterialDirectionAwareNavigationControlCapability";

module.exports = FloorMaterialDirectionAwareNavigationControlCapability;
