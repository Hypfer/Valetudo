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
     * @param {string} options.presignedUrl
     * @param {string} [options.language]
     * @param {string} [options.hash]
     * @returns {Promise<void>}
     */
    async downloadVoicePack(options) {
        throw new NotImplementedError();
    }

    /**
     * This method should return the progress of the current voice pack operation.
     * The progress should be returned as a percentage, null if the operation has completed or no operation in progress.
     *
     * @returns {Promise<[number]>}
     */
    async getVoicePackOperationProgress() {
        return null;
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