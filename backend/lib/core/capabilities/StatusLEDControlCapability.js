const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class StatusLEDControlCapability extends SimpleToggleCapability {
    getType() {
        return StatusLEDControlCapability.TYPE;
    }
}

StatusLEDControlCapability.TYPE = "StatusLEDControlCapability";

module.exports = StatusLEDControlCapability;
