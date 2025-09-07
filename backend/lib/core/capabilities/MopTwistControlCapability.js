const SimpleToggleCapability = require("./SimpleToggleCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends SimpleToggleCapability<T>
 */
class MopTwistControlCapability extends SimpleToggleCapability {
    getType() {
        return MopTwistControlCapability.TYPE;
    }
}

MopTwistControlCapability.TYPE = "MopTwistControlCapability";

module.exports = MopTwistControlCapability;
