const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class ButtonLightsControlCapability extends SimpleToggleCapability {
    getType() {
        return ButtonLightsControlCapability.TYPE;
    }
}

ButtonLightsControlCapability.TYPE = "ButtonLightsControlCapability";

module.exports = ButtonLightsControlCapability;
