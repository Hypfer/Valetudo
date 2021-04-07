const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * Development API to send raw commands to the robot.
 * It must be explicitly enabled by setting debug.enableDebugCapability = true in config.
 *
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class DebugCapability extends Capability {
    /**
     * Robots may implement this and do whatever they prefer. This is intended exclusively for debuggging purposes and
     * it should not be used for anything meaningful.
     *
     * @param {object} payload Robot-dependent payload
     * @abstract
     * @returns {Promise<*>}
     */
    async debug(payload) {
        throw new NotImplementedError();
    }

    getType() {
        return DebugCapability.TYPE;
    }
}

DebugCapability.TYPE = "DebugCapability";

module.exports = DebugCapability;
