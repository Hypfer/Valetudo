const ValetudoVoicePackOperationStatus = require("../../../entities/core/ValetudoVoicePackOperationStatus");
const VoicePackManagementCapability = require("../../../core/capabilities/VoicePackManagementCapability");

const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");
const Logger = require("../../../Logger");

/**
 * @extends VoicePackManagementCapability<import("../DreameValetudoRobot")>
 */
class DreameVoicePackManagementCapability extends VoicePackManagementCapability {
    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].AUDIO.SIID;
        this.active_voicepack_piid = DreameMiotServices["GEN2"].AUDIO.PROPERTIES.ACTIVE_VOICEPACK.PIID;
        this.voicepack_install_status_piid = DreameMiotServices["GEN2"].AUDIO.PROPERTIES.VOICEPACK_INSTALL_STATUS.PIID;
        this.install_voicepack_piid = DreameMiotServices["GEN2"].AUDIO.PROPERTIES.INSTALL_VOICEPACK.PIID;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }
    /**
     * Returns the current applied voice pack language.
     *
     * @returns {Promise<string>}
     */
    async getCurrentVoiceLanguage() {
        const res = await this.helper.readProperty(this.siid, this.active_voicepack_piid);

        return typeof res.toLowerCase === "function" ? res.toLowerCase() : res;
    }

    /**
     * This method should instruct the vacuum to download a voice pack from `url`.
     * The actual specifications of what exactly is hosted behind url depend on the specific vacuum model.
     * The same goes for the hash, the user should provide a hash or signature as expected by the vacuum.
     *
     * @param {object} options
     * @param {string} options.url
     * @param {string} [options.language]
     * @param {string} [options.hash]
     * @returns {Promise<void>}
     */
    async downloadVoicePack(options) {
        //Note that "EN" will not be downloaded by the robot
        await this.helper.writeProperty(
            this.siid,
            this.install_voicepack_piid,
            JSON.stringify({
                id: typeof options.language === "string" ? options.language.toUpperCase() : "VA",
                md5: options.hash?.toLowerCase(), //MD5 is actually validated on dreame
                url: options.url,
                size: 1 //This doesn't need to be correct. it just needs to be set
            })
        );
    }

    /**
     * This method should return the status of the current voice pack operation, if one is ongoing.
     *
     * @returns {Promise<ValetudoVoicePackOperationStatus>}
     */
    async getVoicePackOperationStatus() {
        let statusOptions = {
            type: ValetudoVoicePackOperationStatus.TYPE.IDLE,
            progress: undefined,
        };

        const res = await this.helper.readProperty(this.siid, this.voicepack_install_status_piid);

        let response;
        try {
            response = JSON.parse(res.replace(/\\/g, ""));
        } catch (e) {
            Logger.warn("DreameVoicePackManagementCapability: Error while parsing status response", e);
        }

        if (response) {
            switch (response.state) {
                case "success":
                case "idle":
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.IDLE;
                    break;
                case "fail":
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.ERROR;
                    break;
                case "downloading":
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.DOWNLOADING;
                    statusOptions.progress = response.progress;
                    break;
                default:
                    Logger.warn("DreameVoicePackManagementCapability: Unhandled state", response);
            }
        } else {
            statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.ERROR;
        }


        return new ValetudoVoicePackOperationStatus(statusOptions);
    }
}

module.exports = DreameVoicePackManagementCapability;
