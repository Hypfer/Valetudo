const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class DoNotDisturbCapability extends Capability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<import("../../entities/core/ValetudoDNDConfiguration")>}
     */
    async getDndConfiguration() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async deleteDndConfiguration() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {import("../../entities/core/ValetudoDNDConfiguration")} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        throw new NotImplementedError();
    }

    getType() {
        return DoNotDisturbCapability.TYPE;
    }
}

DoNotDisturbCapability.TYPE = "DoNotDisturbCapability";

module.exports = DoNotDisturbCapability;