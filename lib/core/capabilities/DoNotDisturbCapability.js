const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class DoNotDisturbCapability extends Capability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../entities/state/attributes/DoNotDisturbAttribute")>>}
     */
    async getDnd() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async deleteDnd() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {object} preset
     * @returns {Promise<void>}
     */
    async setDnd(preset) {
        throw new NotImplementedError();
    }

    getType() {
        return DoNotDisturbCapability.TYPE;
    }
}

DoNotDisturbCapability.TYPE = "DoNotDisturbCapability";

module.exports = DoNotDisturbCapability;