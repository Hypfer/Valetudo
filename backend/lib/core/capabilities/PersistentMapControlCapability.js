const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * Control whether or not the robot should persist its map and continuously work with it
 * instead of creating a new one on each cleanup
 *
 * Why would you turn this off? Stop!
 *
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class PersistentMapControlCapability extends SimpleToggleCapability {
    getType() {
        return PersistentMapControlCapability.TYPE;
    }
}

PersistentMapControlCapability.TYPE = "PersistentMapControlCapability";

module.exports = PersistentMapControlCapability;
