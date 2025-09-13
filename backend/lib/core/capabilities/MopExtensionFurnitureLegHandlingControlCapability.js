const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class MopExtensionFurnitureLegHandlingControlCapability extends SimpleToggleCapability {
    getType() {
        return MopExtensionFurnitureLegHandlingControlCapability.TYPE;
    }
}

MopExtensionFurnitureLegHandlingControlCapability.TYPE = "MopExtensionFurnitureLegHandlingControlCapability";

module.exports = MopExtensionFurnitureLegHandlingControlCapability;
