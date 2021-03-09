const VoicePackManagementCapability = require("../../../core/capabilities/VoicePackManagementCapability");
const ValetudoVoicePackOperationStatus = require("../../../entities/core/ValetudoVoicePackOperationStatus");

const Logger = require("../../../Logger");

class RoborockVoicePackManagementCapability extends VoicePackManagementCapability {
    /**
     * Returns the current applied voice pack language.
     *
     * @returns {Promise<string>}
     */
    async getCurrentVoiceLanguage() {
        /**
          Example response:
             {
                'location': 'de',
                'sid_in_progress': 0,
                'bom': 'A.03.0005',
                'sid_version': 5,
                'msg_ver': 3,
                'sid_in_use': 3,
                'language': 'en'
            }
         */
        const res = await this.robot.sendCommand("get_current_sound", []);
        // @ts-ignore
        // noinspection JSUnresolvedVariable
        return VOICEPACK_ID_TO_COUNTRY_CODE_MAPPING[res[0].sid_in_use] || "??";
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
        const payload = {};

        //There are more default packs, but who needs anything apart from the english language?
        if (options.language === "en") {
            payload.sid = 3;
            payload.default = "en";
        } else {
            payload.url = options.url;
            payload.md5 = options.hash; //Roborock doesn't validate this if it's missing
            payload.sid = 10000; //We'll define this id as the one custom slot voicepack id
        }

        await this.robot.sendCommand("dnld_install_sound", payload);
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

        /*
            Example response:
            {
              "sid_in_progress": 0,
              "progress": 0,
              "state": 0,
              "error": 0
            }
         */
        const res = await this.robot.sendCommand("get_sound_progress", []);

        if (res[0]) {
            switch (res[0].state) {
                case 0:
                case 2:
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.IDLE;
                    break;
                case 1:
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.DOWNLOADING;
                    statusOptions.progress = res[0].progress;
                    break;
                case 3:
                    //This actually seems to be "installed successfully"
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.IDLE;
                    break;
                case 4:
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.ERROR;
                    break;
                default:
                    Logger.warn("RoborockVoicePackManagementCapability: Unhandled state " + res[0].state);
            }

            switch (res[0].error) {
                case 0:
                    break;
                case 2:
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.ERROR;
                    Logger.warn("RoborockVoicePackManagementCapability: Failed to install Voicepack. Download failed");
                    break;
                case 13:
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.ERROR;
                    Logger.warn("RoborockVoicePackManagementCapability: Failed to install Voicepack. Disk is full");
                    break;
                default:
                    statusOptions.type = ValetudoVoicePackOperationStatus.TYPE.ERROR;
                    Logger.warn("RoborockVoicePackManagementCapability: Failed to install Voicepack. Unknown error code " + res[0].error);
                    break;
            }
        }


        return new ValetudoVoicePackOperationStatus(statusOptions);
    }
}

const VOICEPACK_ID_TO_COUNTRY_CODE_MAPPING = {
    1: "prc",
    2: "tw",
    3: "en",
    10000: "va" //custom. therefore using this unassigned country code for valetudo :)
};

module.exports = RoborockVoicePackManagementCapability;
