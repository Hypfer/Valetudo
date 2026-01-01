const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class IntensiveMoppingPathControlCapability extends SimpleToggleCapability {
    getType() {
        return IntensiveMoppingPathControlCapability.TYPE;
    }
}

IntensiveMoppingPathControlCapability.TYPE = "IntensiveMoppingPathControlCapability";

module.exports = IntensiveMoppingPathControlCapability;
