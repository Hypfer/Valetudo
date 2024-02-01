const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class SetMCUTimeCapability extends Capability {
    /**
     * Sets the MCU time
     *
     * @abstract
     * @param {Date} date
     * @returns {Promise<void>}
     */
    async setTime(date) {
        throw new NotImplementedError();
    }

    getType() {
        return SetMCUTimeCapability.TYPE;
    }
}

SetMCUTimeCapability.TYPE = "SetMCUTimeCapability";

module.exports = SetMCUTimeCapability;
