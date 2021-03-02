const NotImplementedError = require("../NotImplementedError");
const Capability = require("./Capability");

class VoicePackManagementCapability extends Capability {
    /**
     * This method must return voice packs that are available on the device without requiring any downloads, or voice
     * packs that the vacuum can download and apply without additional user input.
     * For example, the Viomi has English and Chinese pre-installed, other voice packs require to be downloaded.
     * Therefore it should only return English and Chinese at any time, even if a downloaded voice pack is available,
     * Other vacuums which can talk to the cloud server without additional intervention, or whose capability can perform
     * the same, may list the available voice packs here.
     *
     * @abstract
     * @returns {Promise<string[]>}
     */
    async getAvailableStockVoicePacks() {
        throw new NotImplementedError();
    }

    /**
     * This method can be used to enable a local, pre-installed stock voice pack, or instruct the vacuum to download one
     * of its stock voice packs.
     *
     * @abstract
     * @param {string} language
     * @returns {Promise<void>}
     */
    async enableStockVoicePack(language) {
        throw new NotImplementedError();
    }

    /**
     * Returns the current applied voice pack language.
     *
     * @abstract
     * @returns {Promise<void>}
     */
    async getCurrentVoiceLanguage() {
        throw new NotImplementedError();
    }

    /**
     * This method should return whether the `downloadCustomVoicePack` functionality is supported by the vacuum.
     *
     * @returns {Promise<boolean>}
     */
    async canDownloadCustomVoicePack() {
        return false;
    }

    /**
     * This method should instruct the vacuum to download a voice pack from `presignedUrl`.
     * The actual specifications of what exactly is hosted behind presignedUrl depend on the specific vacuum model.
     * The same goes for the hash, the user should provide a hash or signature as expected by the vacuum.
     *
     * @param {object} options
     * @param {string} options.presignedUrl
     * @param {string} [options.language]
     * @param {string} [options.hash]
     * @returns {Promise<void>}
     */
    async downloadCustomVoicePack(options) {
        return null;
    }

    /**
     * This method should return the progress of the current voice pack operation.
     * This could describe one of the following:
     * - Progress of custom or stock (but not available locally) voice pack download
     * - Progress of unpacking of in-device voice pack
     * The progress should be returned as a percentage, null if the operation has completed or no operation in progress.
     *
     * @abstract
     * @returns {Promise<[number]>}
     */
    async getVoicePackOperationProgress() {
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