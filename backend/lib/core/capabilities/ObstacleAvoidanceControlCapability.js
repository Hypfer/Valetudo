const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class ObstacleAvoidanceControlCapability extends SimpleToggleCapability {
    getType() {
        return ObstacleAvoidanceControlCapability.TYPE;
    }
}

ObstacleAvoidanceControlCapability.TYPE = "ObstacleAvoidanceControlCapability";

module.exports = ObstacleAvoidanceControlCapability;
