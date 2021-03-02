const VoicePackManagementCapability = require("../../../core/capabilities/VoicePackManagementCapability");

class ViomiVoicePackManagementCapability extends VoicePackManagementCapability {
    /**
     * Returns the current applied voice pack language.
     *
     * @abstract
     * @returns {Promise<string>}
     */
    async getCurrentVoiceLanguage() {
        const res = await this.robot.sendCommand("get_downloadstatus", []);
        // @ts-ignore
        // noinspection JSUnresolvedVariable
        return res.curVoice;
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
    async downloadVoicePack(options) {
        let args = ["it", options.presignedUrl, "viomi doesn't even bother blabla"];
        if (options.language) {
            args[0] = options.language;
        }
        if (options.hash) {
            args[2] = options.hash;
        }

        await this.robot.sendCommand("download_voice", args);
    }

    /**
     * This method should return the progress of the current voice pack operation.
     * This could describe one of the following:
     * - Progress of custom or stock (but not available locally) voice pack download
     * - Progress of unpacking of in-device voice pack
     * The progress should be returned as a percentage, null if the operation has completed or no operation in progress.
     *
     * @returns {Promise<[number]>}
     */
    async getVoicePackOperationProgress() {
        const res = await this.robot.sendCommand("get_downloadstatus", []);
        // @ts-ignore
        // noinspection JSUnresolvedVariable
        if (res.targetVoice === "") {
            return null;
        }
        // @ts-ignore
        // noinspection JSUnresolvedVariable
        return res.progress;
    }
}

module.exports = ViomiVoicePackManagementCapability;