const fs = require("fs");
const Logger = require("../../Logger");

const capabilities = require("./capabilities");

const DreameMapParser = require("./DreameMapParser");

const entities = require("../../entities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const ValetudoMap = require("../../entities/map/ValetudoMap");

const stateAttrs = entities.state.attributes;

class DreameValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {object} options.miotServices
     * @param {object} options.miotServices.MAP
     * @param {number} options.miotServices.MAP.SIID
     * @param {object} options.miotServices.MAP.ACTIONS
     * @param {object} options.miotServices.MAP.ACTIONS.POLL
     * @param {number} options.miotServices.MAP.ACTIONS.POLL.AIID
     */
    constructor(options) {
        super(options);

        this.lastMapPoll = new Date(0);

        this.miotServices = options.miotServices;

        this.registerCapability(new capabilities.DreameWifiConfigurationCapability({
            robot: this
        }));

        this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
            type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN,
            attached: true
        }));
    }

    setEmbeddedParameters() {
        this.deviceConfPath = DreameValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = DreameValetudoRobot.TOKEN_FILE_PATH;
    }

    onMessage(msg) {
        switch (msg.method) {
            case "_sync.gen_tmp_presigned_url":
                this.sendCloud({
                    id: msg.id,
                    result: {
                        urls: msg.params.indexes.map(i => {
                            return {
                                url: this.mapUploadUrlPrefix + "/api/miio/map_upload_handler?ts=" + process.hrtime().toString().replace(/,/g, ""),
                                obj_name: process.hrtime().toString().replace(/,/g, "") + "/" + i,
                                method: "PUT",
                                expires_time: Math.floor(new Date(new Date().getTime() + 15*60000).getTime() /1000), //+15min
                            };
                        })
                    }
                });
                return true;

            case "_sync.gen_presigned_url": {
                this.sendCloud({
                    id: msg.id,
                    result: {
                        [msg.params.suffix]: {
                            url: this.mapUploadUrlPrefix + "/api/miio/map_upload_handler?ts=" + process.hrtime(),
                            obj_name: process.hrtime().toString().replace(/,/g, "") + msg.params.suffix,
                            method: "PUT",
                            expires_time: Math.floor(new Date(new Date().getTime() + 15*60000).getTime() /1000), //+15min
                            ok: true,
                            pwd: "helloworld"
                        },
                        ok: true
                    },
                });

                return true;
            }
        }

        return false;
    }

    pollMap() {
        // Guard against multiple concurrent polls.
        if (this.pollingMap) {
            return;
        }

        const now = new Date();
        if (now.getTime() - 600 > this.lastMapPoll.getTime()) {
            this.pollingMap = true;
            this.lastMapPoll = now;

            // Clear pending timeout, since we’re starting a new poll right now.
            if (this.pollMapTimeout) {
                clearTimeout(this.pollMapTimeout);
            }

            this.sendCommand("action",
                {
                    did: this.deviceId,
                    siid: this.miotServices.MAP.SIID,
                    aiid: this.miotServices.MAP.ACTIONS.POLL.AIID,
                    in: [{
                        piid: 2,
                        value: "{\"frame_type\":\"I\"}"
                    }]
                }
            ).then(res => {
                let repollSeconds = 60;

                let StatusStateAttribute = this.state.getFirstMatchingAttribute({
                    attributeClass: stateAttrs.StatusStateAttribute.name
                });

                if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                    repollSeconds = 2;
                }


                this.pollMapTimeout = setTimeout(() => this.pollMap(), repollSeconds * 1000);
            }, err => {
                // ¯\_(ツ)_/¯
            }).finally(() => {
                this.pollingMap = false;
            });
        }
    }

    /**
     * Uploaded dreame Maps are actually base64 strings of zlib compressed data with two characters replaced
     *
     * @param {any} data
     * @returns {Promise<Buffer>}
     */
    preprocessMap(data) {
        return new Promise((resolve, reject) => {
            try {
                const preprocessedData = DreameMapParser.PREPROCESS(data);

                resolve(preprocessedData);
            } catch (e) {
                reject(e);
            }
        });
    }

    async parseMap(data) {
        const parsedMap = DreameMapParser.PARSE(data);

        if (parsedMap instanceof ValetudoMap) {
            this.state.map = parsedMap;

            this.emitMapUpdated();
        }

        return this.state.map;
    }

    getManufacturer() {
        return "Dreame Technology Tianjin Co Ltd";
    }

    startup() {
        super.startup();

        if (this.config.get("embedded") === true) {
            try {
                const os_release = fs.readFileSync("/etc/os-release").toString();
                const parsedFile = JSON.parse(os_release);

                if (parsedFile && parsedFile.fw_arm_ver && parsedFile.fw_mcu_ota_ver) {
                    Logger.info("Firmware Version: " + parsedFile.fw_arm_ver);
                    Logger.info("MCU Version: " + parsedFile.fw_mcu_ota_ver);
                }
            } catch (e) {
                Logger.warn("Unable to determine the Firmware Version", e);
            }
        }
    }


    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2009");
    }
}

DreameValetudoRobot.DEVICE_CONF_PATH = "/data/config/miio/device.conf";
DreameValetudoRobot.TOKEN_FILE_PATH = "/data/config/miio/device.token";

DreameValetudoRobot.STATUS_MAP = Object.freeze({
    0: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    1: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED
    },
    2: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING
    },
    3: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    4: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SEGMENT //TODO: is this correct?
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING //TODO: is this correct?
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    7: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    8: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    9: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    10: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    11: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    12: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    13: {
        value: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    14: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    15: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    16: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    17: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    18: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SEGMENT
    },
    19: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.ZONE
    },
    20: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SPOT
    }
});

DreameValetudoRobot.FAN_SPEEDS = {
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 0,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 1,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 2,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MAX]: 3
};

DreameValetudoRobot.WATER_GRADES = Object.freeze({
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.LOW]: 1,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.MEDIUM]: 2,
    [stateAttrs.PresetSelectionStateAttribute.INTENSITY.HIGH]: 3,
});

//TODO: Refactor to something like ValetudoErrorCodes
DreameValetudoRobot.ERROR_CODES = {
    "0": "No error",
    "1": "Wheel lost floor contact. Robot is on the verge of falling",
    "2": "Obstacle sensor dirty",
    "3": "Stuck front bumper",
    "4": "Tilted robot",
    "5": "Stuck front bumper",
    "6": "Wheel lost floor contact. Robot is on the verge of falling",
    "7": "Internal error",
    "8": "Dustbin missing",
    "11": "Filter jammed",
    "12": "Main brush jammed",
    "13": "Side brush jammed",
    "14": "Filter jammed",
    "15": "Robot stuck or trapped",
    "16": "Robot stuck or trapped",
    "17": "Robot stuck or trapped",
    "18": "Robot stuck or trapped",
    "20": "Low battery",
    "21": "Charging error",
    "23": "Internal error",
    "24": "Camera dirty",
    "25": "Internal error",
    "26": "Camera dirty",
    "28": "Charging station without power",
    "29": "Battery temperature out of operating range",
    "30": "Internal error",
    "31": "Robot stuck or trapped",
    "32": "Robot stuck or trapped",
    "33": "Internal error",
    "34": "Internal error",
    "35": "Internal error",
    "36": "Internal error",
    "37": "Internal error",
    "38": "Internal error",
    "39": "Internal error",
    "40": "Internal error",
    "41": "Magnetic interference",
    "47": "Cannot reach target",
    "48": "LDS jammed",
    "49": "LDS bumper jammed",
    "51": "Filter jammed",
    "54": "Wall sensor dirty",
    "-2": "Stuck inside restricted area"
};

DreameValetudoRobot.GET_ERROR_CODE_DESCRIPTION = (errorCodeId) => {
    if (DreameValetudoRobot.ERROR_CODES[errorCodeId] !== undefined) {
        return DreameValetudoRobot.ERROR_CODES[errorCodeId];
    } else {
        return "UNKNOWN ERROR CODE " + errorCodeId;
    }
};


module.exports = DreameValetudoRobot;
