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
    }
    /**
     * Returns the current applied voice pack language.
     *
     * @returns {Promise<string>}
     */
    async getCurrentVoiceLanguage() {
        const res = await this.robot.sendCommand("get_properties", [
            {
                did: this.robot.deviceId,
                siid: this.siid,
                piid: this.active_voicepack_piid
            }
        ]);

        if (res?.length === 1) {
            if (res[0].code === 0) {
                return typeof res[0].value.toLowerCase === "function" ? res[0].value.toLowerCase() : res[0].value;
            } else {
                throw new Error("Error code " + res[0].code);
            }
        } else {
            throw new Error("Received invalid response");
        }
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
        const res = await this.robot.sendCommand("action", {
            did: this.robot.deviceId,
            siid: this.siid,
            aiid: this.aiid,
            in: [
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
        });

        if (res?.length === 1) {
            if (res[0].code === 0) {
                return typeof res[0].value.toLowerCase === "function" ? res[0].value.toLowerCase() : res[0].value;
            } else {
                throw new Error("Error code " + res[0].code);
            }

        } else {
            throw new Error("Received invalid response");
        }
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
