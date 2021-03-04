const NotImplementedError = require("../NotImplementedError");
const Capability = require("./Capability");

class VoicePackManagementCapability extends Capability {
    /**
     * Returns the current applied voice pack language.
     *
     * @abstract
     * @returns {Promise<string>}
     */
    async getCurrentVoiceLanguage() {
        throw new NotImplementedError();
    }

    /**
     * This method should instruct the vacuum to download a voice pack from `presignedUrl`.
     * The actual specifications of what exactly is hosted behind presignedUrl depend on the specific vacuum model.
     * The same goes for the hash, the user should provide a hash or signature as expected by the vacuum.
     *
     * @abstract
     * @param {object} options
     * @param {string} options.url
     * @param {string} [options.language]
     * @param {string} [options.hash]
     * @returns {Promise<void>}
     */
    async downloadVoicePack(options) {
        throw new NotImplementedError();
    }

    /**
     * This method should return the status of the current voice pack operation, if one is ongoing.
     *
     * @abstract
     * @returns {Promise<import("../../entities/core/ValetudoVoicePackOperationStatus")>}
     */
    async getVoicePackOperationStatus() {
        throw new NotImplementedError();
    }

    /**
     * @returns {string}
     */
    getType() {
        return VoicePackManagementCapability.TYPE;
    }
}

VoicePackManagementCapability.TYPE = "VoicePackManagementCapability";

module.exports = VoicePackManagementCapability;