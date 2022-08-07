const fs = require("fs");
const Logger = require("../../Logger");

const LinuxWifiScanCapability = require("../common/linuxCapabilities/LinuxWifiScanCapability");
const miioCapabilities = require("../common/miioCapabilities");

const DreameMapParser = require("./DreameMapParser");

const entities = require("../../entities");
const MiioErrorResponseRobotFirmwareError = require("../../miio/MiioErrorResponseRobotFirmwareError");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const PendingMapChangeValetudoEvent = require("../../valetudo_events/events/PendingMapChangeValetudoEvent");
const ValetudoMap = require("../../entities/map/ValetudoMap");
const ValetudoRobot = require("../../core/ValetudoRobot");

const stateAttrs = entities.state.attributes;

class DreameValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     * @param {object} options.miotServices
     * @param {object} options.miotServices.MAP
     * @param {number} options.miotServices.MAP.SIID
     * @param {object} options.miotServices.MAP.ACTIONS
     * @param {object} options.miotServices.MAP.ACTIONS.POLL
     * @param {number} options.miotServices.MAP.ACTIONS.POLL.AIID
     * @param {object} options.miotServices.MAP.PROPERTIES
     * @param {object} options.miotServices.MAP.PROPERTIES.MAP_DATA
     * @param {number} options.miotServices.MAP.PROPERTIES.MAP_DATA.PIID
     */
    constructor(options) {
        super(options);


        this.miotServices = options.miotServices;

        this.registerCapability(new miioCapabilities.MiioWifiConfigurationCapability({
            robot: this,
            networkInterface: "wlan0"
        }));

        if (this.config.get("embedded") === true) {
            this.registerCapability(new LinuxWifiScanCapability({
                robot: this,
                networkInterface: "wlan0"
            }));
        }
    }

    setEmbeddedParameters() {
        this.deviceConfPath = DreameValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = DreameValetudoRobot.TOKEN_FILE_PATH;
    }

    async executeMapPoll() {
        let mapPollResult;
        try {
            mapPollResult = await this.sendCommand("action",
                {
                    did: this.deviceId,
                    siid: this.miotServices.MAP.SIID,
                    aiid: this.miotServices.MAP.ACTIONS.POLL.AIID,
                    in: [{
                        piid: 2,
                        value: "{\"frame_type\":\"I\", \"force_type\": 1, \"req_type\": 1}"
                    }]
                },
                {timeout: 7000} // user ack timeout seems to appear after ~6s on the p2028 1156
            );
        } catch (e) {
            if (e instanceof MiioErrorResponseRobotFirmwareError && e.response?.message === "user ack timeout") {
                /*
                    Since we're polling IFrames much faster than the regular dreame map, occasionally, the dreame
                    firmware isn't quick enough to respond to our requests.
                    
                    As this is expected, we just ignore that error
                 */
            } else {
                Logger.warn("Error while polling map", e);
            }


            return;
        }

        if (mapPollResult.code === 0 && Array.isArray(mapPollResult.out)) {
            for (let prop of mapPollResult.out) {
                if (prop.piid === this.miotServices.MAP.PROPERTIES.MAP_DATA.PIID && prop.value?.length > 15) {
                    try {
                        await this.preprocessAndParseMap(prop.value);
                    } catch (e) {
                        Logger.warn("Error while trying to parse map from miio", e);
                    }
                }
            }
        }
    }

    /**
     * Uploaded dreame Maps are actually base64 strings of zlib compressed data with two characters replaced
     *
     * @param {any} data
     * @returns {Promise<Buffer>}
     */
    async preprocessMap(data) {
        const preprocessedData = await DreameMapParser.PREPROCESS(data);

        if (preprocessedData) {
            return preprocessedData;
        } else {
            throw new Error("Invalid map data");
        }
    }

    async parseMap(data) {
        const parsedMap = await DreameMapParser.PARSE(data);

        if (parsedMap instanceof ValetudoMap) {
            if (
                parsedMap.metaData?.dreamePendingMapChange === true &&
                this.state.map?.metaData?.dreamePendingMapChange !== true
            ) {
                this.valetudoEventStore.raise(new PendingMapChangeValetudoEvent({}));
            }

            this.state.map = parsedMap;

            this.emitMapUpdated();
        }

        return this.state.map;
    }

    /**
     * @public
     * @param {Buffer} data
     * @param {object} query implementation specific query parameters
     * @param {object} params implementation specific url parameters
     * @returns {Promise<void>}
     */
    async handleUploadedFDSData(data, query, params) {
        if (
            Buffer.isBuffer(data) &&
            (
                data[0] === 0x7b || data[0] === 0x5b // 0x7b = "{" 0x5b = "["
            )
        ) {
            //We've received a multi-map JSON but we only want live maps
            Logger.trace("Received unhandled multi-map json", {
                query: query,
                params: params,
                data: data.toString()
            });
        } else if (typeof query?.suffix === "string" && query.suffix.endsWith(".tbz2")) {
            Logger.trace("Received unhandled map backup", {
                query: query,
                params: params
            });
        } else {
            await this.preprocessAndParseMap(data);
        }
    }

    /**
     * @protected
     * @param {Buffer| string} data
     * @returns {Promise<void>}
     */
    async preprocessAndParseMap(data) {
        const preprocessedMap = await this.preprocessMap(data);
        const parsedMap = await this.parseMap(preprocessedMap);

        if (!parsedMap) {
            Logger.warn("Failed to parse uploaded map");
        }
    }

    getManufacturer() {
        return "Dreame";
    }

    startup() {
        super.startup();

        if (this.config.get("embedded") === true) {
            const firmwareVersion = this.getFirmwareVersion();

            if (firmwareVersion.valid) {
                Logger.info("Firmware Version: " + firmwareVersion.arm);
                Logger.info("MCU Version: " + firmwareVersion.mcu);
            }
        }
    }

    /**
     * @private
     * @returns {{arm: string, mcu: string, valid: boolean}}
     */
    getFirmwareVersion() {
        const firmwareVersion = {
            arm: "???",
            mcu: "???",
            valid: false
        };

        try {
            const os_release = fs.readFileSync("/etc/os-release").toString();
            const parsedFile = JSON.parse(os_release);

            if (parsedFile && parsedFile.fw_arm_ver && parsedFile.fw_mcu_ota_ver) {
                firmwareVersion.valid = true;

                firmwareVersion.arm = parsedFile.fw_arm_ver.split("_")?.[1];
                firmwareVersion.mcu = parsedFile.fw_mcu_ota_ver;
            }
        } catch (e) {
            Logger.warn("Unable to determine the Firmware Version", e);
        }

        return firmwareVersion;
    }

    getModelDetails() {
        return Object.assign(
            {},
            super.getModelDetails(),
            {
                supportedAttachments: [
                    stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
                    stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                ]
            }
        );
    }

    /**
     * @return {object}
     */
    getProperties() {
        const superProps = super.getProperties();
        const ourProps = {};

        if (this.config.get("embedded") === true) {
            const firmwareVersion = this.getFirmwareVersion();

            if (firmwareVersion.valid) {
                ourProps[ValetudoRobot.WELL_KNOWN_PROPERTIES.FIRMWARE_VERSION] = firmwareVersion.arm;
            }
        }

        return Object.assign(
            {},
            superProps,
            ourProps
        );
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
        flag: stateAttrs.StatusStateAttribute.FLAG.SEGMENT
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING //TODO: is this correct?
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    7: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    8: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    9: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    10: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    11: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    12: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    13: {
        value: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    14: { //Powersave
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    15: { //SelfTest/AutoRepair of the W10 dock?
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    16: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
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
    },
    21: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING,
        flag: stateAttrs.StatusStateAttribute.FLAG.MAPPING
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
    "2": "Cliff sensor dirty",
    "3": "Stuck front bumper",
    "4": "Tilted robot",
    "5": "Stuck front bumper",
    "6": "Wheel lost floor contact. Robot is on the verge of falling",
    "7": "Internal error",
    "8": "Dustbin missing",
    "9": "Water tank missing",
    "10": "Water tank empty",
    "11": "Dustbin full",
    "12": "Main brush jammed",
    "13": "Side brush jammed",
    "14": "Filter jammed",
    "15": "Robot stuck or trapped",
    "16": "Robot stuck or trapped",
    "17": "Robot stuck or trapped",
    "18": "Robot stuck or trapped",
    "19": "Charging station without power",
    "20": "Low battery",
    "21": "Charging error",
    //22
    "23": "Internal error 23",
    "24": "Camera dirty",
    "25": "Internal error 25",
    "26": "Camera dirty",
    "27": "Sensor dirty",
    "28": "Charging station without power",
    "29": "Battery temperature out of operating range",
    "30": "Internal error 30",
    "31": "Robot stuck or trapped",
    "32": "Robot stuck or trapped",
    "33": "Internal error 33",
    "34": "Internal error 34",
    "35": "Internal error 35",
    "36": "Internal error 36",
    "37": "Internal error 37",
    "38": "Internal error 38",
    "39": "Internal error 39",
    "40": "Internal error 40",
    "41": "Magnetic interference",
    "42": "Internal error 42",
    "43": "Internal error 43",
    "44": "Internal Error 44",
    "45": "Internal Error 45",
    "46": "Internal Error 46",
    "47": "Cannot reach target",
    "48": "LDS jammed",
    "49": "LDS bumper jammed",
    "50": "Internal error 50",
    "51": "Filter jammed",
    "52": "Internal error 52",
    "53": "Internal error 53",
    "54": "Wall sensor dirty",
    "55": "Internal Error 55",
    "56": "Internal Error 56",
    "57": "Internal Error 57",
    "58": "Internal Error 58",
    "59": "Robot trapped by virtual restrictions",
    "60": "Internal Error 60",
    "61": "Cannot reach target",
    "62": "Cannot reach target",
    "63": "Cannot reach target",
    "64": "Cannot reach target",
    "65": "Cannot reach target",
    "66": "Cannot reach target",
    "67": "Cannot reach target",
    "68": "Docked but mop is still attached. Please remove the mop",

    "-2": "Stuck inside restricted area",



    "101": "Auto-Empty Dock dust bag full or dust duct clogged",
    "102": "Auto-Empty Dock cover open or missing dust bag",
    "103": "Auto-Empty Dock cover open or missing dust bag",
    "104": "Auto-Empty Dock dust bag full or dust duct clogged",

    "105": "Mop Dock Clean Water Tank not installed",
    "106": "Mop Dock Wastewater Tank not installed or full",
    "107": "Mop Dock Clean Water Tank empty",
    "108": "Mop Dock Wastewater Tank not installed or full",
    "109": "Mop Dock Wastewater pipe clogged",
    "110": "Mop Dock Wastewater pump damaged",
    "111": "Mop Dock Tray not installed",
    "112": "Mop Dock Tray full of water",
};

DreameValetudoRobot.GET_ERROR_CODE_DESCRIPTION = (errorCodeId) => {
    if (DreameValetudoRobot.ERROR_CODES[errorCodeId] !== undefined) {
        return DreameValetudoRobot.ERROR_CODES[errorCodeId];
    } else {
        return "UNKNOWN ERROR CODE " + errorCodeId;
    }
};


module.exports = DreameValetudoRobot;
