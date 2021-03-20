const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class VoicePackManagementCapability extends Capability {
    /**
     * Returns the current applied voice pack language as lowercase ISO 3166-1 alpha-2 country code
     *
     * @abstract
     * @returns {Promise<string>} lowercase ISO 3166-1 alpha-2 country code
     */
    async getCurrentVoiceLanguage() {
        throw new NotImplementedError();
    }

    /**
     * This method should instruct the vacuum to download a voice pack from `options.url`.
     * The actual specifications of what exactly is hosted behind options.url depend on the specific vacuum model.
     * The same goes for the hash, the user should provide a hash or signature as expected by the vacuum.
     *
     * @abstract
     * @param {object} options
     * @param {string} options.url
     * @param {string} [options.language] lowercase ISO 3166-1 alpha-2 country code
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
