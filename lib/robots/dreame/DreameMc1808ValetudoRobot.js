const zlib = require("zlib");
const capabilities = require("./capabilities");

const MiioValetudoRobot = require("../MiioValetudoRobot");
const entities = require("../../entities");
const Logger = require("../../Logger");
const ValetudoIntensityPreset = require("../../entities/core/ValetudoIntensityPreset");

const stateAttrs = entities.state.attributes;


const SERVICES = Object.freeze({
    BATTERY: {
        ID: 2,
        PROPERTIES: {
            PERCENTAGE: 1,
            CHARGING_STATUS: 2
            /**
             * CHARGING_STATUS = {
                    Charging: 1,
                    Idle: 2,
                    Error: 3,
                    Charged: 4
                  }
             */
        },
        ACTIONS: {
            START_CHARGE: 1 //also known as home
        }
    },
    PLAY_SOUND: {
        ID: 17,
        ACTIONS: {
            LOCATE: 1,
            TEST_VOLUME: 3
        }
    },
    CORE_VACUUM: {
        ID: 18,
        PROPERTIES: {
            WORK_MODE: 1, //TODO: what is this?
            CLEAN_TIME: 2,
            CLEAN_AREA: 3,
            TIMERS: 5,
            FAN_SPEED: 6, //called SELECT_MODE
            WATER_BOX_STATUS: 9, //TODO: POSSIBLE VALUES
            LAST_CLEAN_TIME: 13,
            LAST_CLEAN_TIMES: 14,
            LAST_CLEAN_AREA: 15,
            LAST_LOG_TIME: 16, //TODO: ???? startUseTime
            LED_MODE: 17,
            TASK_STATUS: 18,
            MOP_MODE: 20,
            SAVE_MAP_STATUS: 23
        },
        ACTIONS: {
            START_CLEANING: 1,
            PAUSE: 2,
            STOP_CLEANING: 3
        }
    },
    TIMEZONE: {
        ID: 25,
        PROPERTIES: {
            TIMEZONE: 1
        }
    },
    ERRORS: {
        ID: 22,
        PROPERTIES: {
            WARNCODES: 1
        }
    },
    CONSUMABLES: {
        ID: 19,
        PROPERTIES: {
            HEAP: 1,
            SLID_BRUSH: 2,
            MAIN_BRUSH: 3
        }
    },
    DND: {
        ID: 20,
        PROPERTIES: {
            ENABLED: 1,
            START: 2,
            END: 3

        }
    }
});

class DreameMc1808ValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(options);

        this.lastMapPoll = new Date(0);
        this.fanSpeeds = Object.freeze({
            [stateAttrs.IntensityStateAttribute.VALUE.LOW] : 0,
            [stateAttrs.IntensityStateAttribute.VALUE.MEDIUM] : 1,
            [stateAttrs.IntensityStateAttribute.VALUE.HIGH] : 2,
            [stateAttrs.IntensityStateAttribute.VALUE.MAX] : 3
        });

        this.registerCapability(new capabilities.DreameBasicControlCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.DreameFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(this.fanSpeeds).map(k => new ValetudoIntensityPreset({name: k, value: this.fanSpeeds[k]}))
        }));
    }

    setEmbeddedPaths() {
        this.deviceConfPath = DreameMc1808ValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = DreameMc1808ValetudoRobot.TOKEN_FILE_PATH;
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

        if (msg.method === "properties_changed") {
            this.parseAndUpdateState(msg.params);

            this.sendCloud({id: msg.id, "result":["ok"]});
            return true;
        }

        return false;
    }

    async pollState() {
        const response = await this.sendCommand("get_properties", [
            {
                siid: SERVICES.BATTERY.ID,
                piid: SERVICES.BATTERY.PROPERTIES.PERCENTAGE
            },
            {
                siid: SERVICES.CORE_VACUUM.ID,
                piid: SERVICES.CORE_VACUUM.PROPERTIES.WORK_MODE
            },
            {
                siid: SERVICES.CORE_VACUUM.ID,
                piid: SERVICES.CORE_VACUUM.PROPERTIES.FAN_SPEED
            }
        ].map(e => {
            e.did = this.deviceId; //TODO

            return e;
        }));

        if (response) {
            this.parseAndUpdateState(response);
        }

        return this.state;
    }


    //TODO: viomi repolls the map on status change to quick poll states. We probably should do the same
    parseAndUpdateState(data) {
        if (!Array.isArray(data)) {
            Logger.error("Received non-array state", data);
            return;
        }

        data.forEach(elem => {
            switch (elem.siid) {
                case SERVICES.BATTERY.ID:
                    switch (elem.piid) {
                        case SERVICES.BATTERY.PROPERTIES.PERCENTAGE:
                            this.state.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                                level: elem.value
                            }));
                            break;
                    }
                    break;
                case SERVICES.CORE_VACUUM.ID:
                    switch (elem.piid) {
                        case SERVICES.CORE_VACUUM.PROPERTIES.WORK_MODE:
                            if (WORK_MODE_MAP[elem.value]) {
                                let statusValue = WORK_MODE_MAP[elem.value].value;
                                let statusFlag = WORK_MODE_MAP[elem.value].flag;

                                this.state.upsertFirstMatchingAttribute(new stateAttrs.StatusStateAttribute({
                                    value: statusValue,
                                    flag: statusFlag
                                }));
                            } else {
                                Logger.warn("Unhandled Work Mode", elem.value);
                            }
                            break;
                        case SERVICES.CORE_VACUUM.PROPERTIES.FAN_SPEED: {
                            let matchingFanSpeed = Object.keys(this.fanSpeeds).find(key => this.fanSpeeds[key] === elem.value);

                            this.state.upsertFirstMatchingAttribute(new stateAttrs.IntensityStateAttribute({
                                type: stateAttrs.IntensityStateAttribute.TYPE.FAN_SPEED,
                                value: matchingFanSpeed
                            }));
                            break;
                        }
                    }
                    break;
            }
        });

        this.emitStateUpdated();
    }

    pollMap() {
        //TODO
        /*
        clearTimeout(this.pollMapTask);
        this.sendCommand("action",
            {
                did: this.deviceId,
                siid: 23,
                aiid: 1,
                in: [{
                    piid: 2,
                    value: "{\"frame_type\":\"I\"}"
                }]
            }
        ).finally(() => {
            let repollSeconds = 30;


            this.pollMapTask = setTimeout(() => this.pollMap(), repollSeconds * 1000);
        }); */
    }

    /**
     * Uploaded dreame Maps are actually base64 strings of zlib compressed data with two characters replaced
     *
     * @param {any} data
     * @returns {Promise<Buffer>}
     */
    preprocessMap(data) {
        const base64String = data.toString().replace(/_/g, "/").replace(/-/g, "+");


        return new Promise((resolve, reject) => {
            zlib.inflate(
                Buffer.from(base64String, "base64"),
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
        });
    }

    parseMap(data) {
        Logger.info("Received map ", {
            mapData: data.toString("base64")
        });

        return null;
    }

    getManufacturer() {
        return "Dreame Technology Tianjin Co Ltd";
    }

    getModelName() {
        return "Xiaomi Mija 1C Robot Vacuum Mop";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameMc1808ValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.mc1808");
    }
}

DreameMc1808ValetudoRobot.DEVICE_CONF_PATH = "/data/config/miio/device.conf";
DreameMc1808ValetudoRobot.TOKEN_FILE_PATH = "/data/config/miio/device.token";

const WORK_MODE_MAP = Object.freeze({
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
        flag: stateAttrs.StatusStateAttribute.FLAG.SECTION //TODO: is this correct?
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
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING, //TODO: maybe this is segment?
        flag: stateAttrs.StatusStateAttribute.FLAG.ZONE
    },
    19: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.ZONE
    }
});


module.exports = DreameMc1808ValetudoRobot;