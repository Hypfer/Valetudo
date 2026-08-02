const Capability = require("./Capability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class ValetudoBasedCapability extends Capability {
    async shutdown() {
        // no-op
    }
}

module.exports = ValetudoBasedCapability;
