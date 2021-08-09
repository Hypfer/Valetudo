const DreameMiotHelper = require("../DreameMiotHelper");
const ValetudoVoicePackOperationStatus = require("../../../entities/core/ValetudoVoicePackOperationStatus");
const VoicePackManagementCapability = require("../../../core/capabilities/VoicePackManagementCapability");

class Dreame1CVoicePackManagementCapability extends VoicePackManagementCapability {
    /**
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.aiid MIOT Action ID
     * @param {number} options.hash_piid
     * @param {number} options.url_piid
     * @param {number} options.active_voicepack_piid
     * @param {number} options.size_piid
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.aiid = options.aiid;
        this.hash_piid = options.hash_piid;
        this.url_piid = options.url_piid;
        this.active_voicepack_piid = options.active_voicepack_piid;
        this.size_piid = options.size_piid;

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
        await this.helper.executeAction(
            this.siid,
            this.aiid,
            [
                {
                    piid: this.active_voicepack_piid,
                    value: typeof options.language === "string" ? options.language.toUpperCase() : "VA"
                },
                {
                    piid: this.url_piid,
                    value: options.url
                },
                {
                    piid: this.hash_piid,
                    value: options.hash
                },
                {
                    piid: this.size_piid,
                    value: 1
                }
            ]
        );
    }

    /**
     * This method should return the status of the current voice pack operation, if one is ongoing.
     *
     * @returns {Promise<ValetudoVoicePackOperationStatus>}
     */
    async getVoicePackOperationStatus() {
        // Voice pack operation status is returned via events.
        // Since the capability mechanism doesn't support events and
        // I didn't find a get_properties way to retrieve it, it's unsupported (for now?) and will always return IDLE

        const statusOptions = {
            type: ValetudoVoicePackOperationStatus.TYPE.IDLE,
            progress: undefined
        };

        return new ValetudoVoicePackOperationStatus(statusOptions);
    }
}

module.exports = Dreame1CVoicePackManagementCapability;
