const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class MopExtensionControlCapability extends SimpleToggleCapability {
    getType() {
        return MopExtensionControlCapability.TYPE;
    }
}

MopExtensionControlCapability.TYPE = "MopExtensionControlCapability";

module.exports = MopExtensionControlCapability;
