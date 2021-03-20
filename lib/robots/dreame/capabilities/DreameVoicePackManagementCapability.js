const ValetudoVoicePackOperationStatus = require("../../../entities/core/ValetudoVoicePackOperationStatus");
const VoicePackManagementCapability = require("../../../core/capabilities/VoicePackManagementCapability");

const Logger = require("../../../Logger");

class DreameVoicePackManagementCapability extends VoicePackManagementCapability {
    /**
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.active_voicepack_piid
     * @param {number} options.voicepack_install_status_piid
     * @param {number} options.install_voicepack_piid
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.active_voicepack_piid = options.active_voicepack_piid;
        this.voicepack_install_status_piid = options.voicepack_install_status_piid;
        this.install_voicepack_piid = options.install_voicepack_piid;
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
        //Note that "EN" will not be downloaded by the robot
        const res = await this.robot.sendCommand("set_properties", [
            {
                did: this.robot.deviceId,
                siid: this.siid,
                piid: this.install_voicepack_piid,
                value: JSON.stringify({
                    id: typeof options.language === "string" ? options.language.toUpperCase() : "VA",
                    md5: options.hash, //MD5 is actually validated on dreame
                    url: options.url,
                    size: 1 //This doesn't need to be correct. it just needs to be set
                })
            }
        ]);

        if (res?.length === 1) {
            if (res[0].code !== 0) {
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
        let statusOptions = {
            type: ValetudoVoicePackOperationStatus.TYPE.IDLE,
            progress: undefined,
        };

        const res = await this.robot.sendCommand("get_properties", [
            {
                did: this.robot.deviceId,
                siid: this.siid,
                piid: this.voicepack_install_status_piid
            }
        ]);

        if (res?.length === 1) {
            if (res[0].code === 0) {
                let response;
                try {
                    response = JSON.parse(res[0].value.replace(/\\/g, ""));
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


            } else {
                throw new Error("Error code " + res[0].code);
            }

        } else {
            throw new Error("Received invalid response");
        }


        return new ValetudoVoicePackOperationStatus(statusOptions);
    }
}

module.exports = DreameVoicePackManagementCapability;
