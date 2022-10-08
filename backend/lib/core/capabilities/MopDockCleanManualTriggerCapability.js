const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 *
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MopDockCleanManualTriggerCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async startCleaning() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async stopCleaning() {
        throw new NotImplementedError();
    }

    getType() {
        return MopDockCleanManualTriggerCapability.TYPE;
    }
}

MopDockCleanManualTriggerCapability.TYPE = "MopDockCleanManualTriggerCapability";

module.exports = MopDockCleanManualTriggerCapability;
