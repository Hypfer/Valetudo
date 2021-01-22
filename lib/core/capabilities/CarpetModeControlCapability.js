const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class CarpetModeControlCapability extends Capability {
    /**
     * This function polls the current carpet mode state
     * 
     * @abstract
     * @returns {Promise<import("../../entities/core/ValetudoCarpetModeConfiguration")>}
     */
    async getCarpetMode() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {import("../../entities/core/ValetudoCarpetModeConfiguration")} config
     * @returns {Promise<void>}
     */
    async setCarpetMode(config) {
        throw new NotImplementedError();
    }

    getType() {
        return CarpetModeControlCapability.TYPE;
    }
}

CarpetModeControlCapability.TYPE = "CarpetModeControlCapability";

module.exports = CarpetModeControlCapability;