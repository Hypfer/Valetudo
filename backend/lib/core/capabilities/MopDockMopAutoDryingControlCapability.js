const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class MopDockMopAutoDryingControlCapability extends SimpleToggleCapability {
    getType() {
        return MopDockMopAutoDryingControlCapability.TYPE;
    }
}

MopDockMopAutoDryingControlCapability.TYPE = "MopDockMopAutoDryingControlCapability";

module.exports = MopDockMopAutoDryingControlCapability;
