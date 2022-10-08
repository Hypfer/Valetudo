const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 *
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MopDockDryManualTriggerCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async startDrying() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async stopDrying() {
        throw new NotImplementedError();
    }

    getType() {
        return MopDockDryManualTriggerCapability.TYPE;
    }
}

MopDockDryManualTriggerCapability.TYPE = "MopDockDryManualTriggerCapability";

module.exports = MopDockDryManualTriggerCapability;
