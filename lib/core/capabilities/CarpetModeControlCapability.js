const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class CarpetModeControlCapability extends Capability {
    /**
     * This function polls the current carpet mode state
     * 
     * @abstract
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enable() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async disable() {
        throw new NotImplementedError();
    }

    getType() {
        return CarpetModeControlCapability.TYPE;
    }
}

CarpetModeControlCapability.TYPE = "CarpetModeControlCapability";

module.exports = CarpetModeControlCapability;