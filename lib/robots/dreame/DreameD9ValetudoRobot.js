const zlib = require("zlib");
const capabilities = require("./capabilities");

const DreameMapParser = require("../../DreameMapParser");

const MiioValetudoRobot = require("../MiioValetudoRobot");
const ValetudoIntensityPreset = require("../../entities/core/ValetudoIntensityPreset");
const entities = require("../../entities");
const Logger = require("../../Logger");
const ValetudoMap = require("../../entities/map/ValetudoMap");

const stateAttrs = entities.state.attributes;

//https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:vacuum:0000A006:dreame-p2009:1
const MIOT_SERVICES = Object.freeze({
    VACUUM_1: {
        SIID: 2,
        ACTIONS: {
            RESUME: {
                AIID: 1
            },
            PAUSE: {
                AIID: 2
            }
        }
    },
    VACUUM_2: {
        SIID: 4,
        PROPERTIES: {
            STATUS: {
                PIID: 1
            },
            FAN_SPEED: {
                PIID: 4
            }
        },
        ACTIONS: {
            START: {
                AIID: 1
            },
            STOP: {
                AIID: 2
            }
        }
    },
    BATTERY: {
        SIID: 3,
        PROPERTIES: {
            LEVEL: {
                PIID: 1
            }
        },
        ACTIONS: {
            START_CHARGE: {
                AIID: 1
            }
        }
    },
    LOCATE: {
        SIID: 7,
        ACTIONS: {
            LOCATE: {
                AIID: 1
            }
        }
    },
    MAP: {
        SIID: 6,
        PROPERTIES: {
            MAP_DATA: {
                PIID: 1
            },
            FRAME_TYPE: { //Can be char I or P (numbers)
                PIID: 2
            }
        },
        ACTION: {
            POLL: {
                AIID: 1
            },
            IDK_MAYBE_EDIT: { //TODO
                AIID: 2
            }
        }
    }
});



class DreameD9ValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(options);

        this.lastMapPoll = new Date(0);

        this.registerCapability(new capabilities.DreameBasicControlCapability({
            robot: this,
            miot_actions: {
                start: {
                    siid: MIOT_SERVICES.VACUUM_1.SIID,
                    aiid: MIOT_SERVICES.VACUUM_1.ACTIONS.RESUME.AIID
                },
                stop: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    aiid: MIOT_SERVICES.VACUUM_2.ACTIONS.STOP.AIID
                },
                pause: {
                    siid: MIOT_SERVICES.VACUUM_1.SIID,
                    aiid: MIOT_SERVICES.VACUUM_1.ACTIONS.PAUSE.AIID
                },
                home: {
                    siid: MIOT_SERVICES.BATTERY.SIID,
                    aiid: MIOT_SERVICES.BATTERY.ACTIONS.START_CHARGE.AIID
                }
            }
        }));

        this.registerCapability(new capabilities.DreameFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(FAN_SPEEDS).map(k => new ValetudoIntensityPreset({name: k, value: FAN_SPEEDS[k]})),
            siid: MIOT_SERVICES.VACUUM_2.SIID,
            piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID
        }));

        this.registerCapability(new capabilities.DreameLocateCapability({
            robot: this,
            siid: MIOT_SERVICES.LOCATE.SIID,
            aiid: MIOT_SERVICES.LOCATE.ACTIONS.LOCATE.AIID
        }));

        this.registerCapability(new capabilities.DreameWifiConfigurationCapability({
            robot: this
        }));
    }

    setEmbeddedParameters() {
        this.deviceConfPath = DreameD9ValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = DreameD9ValetudoRobot.TOKEN_FILE_PATH;
        this.embeddedDummycloudIp = "203.0.113.1"; //required for the lo alias approach
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

            case "properties_changed": {
                msg.params.forEach(e => {
                    if (e.siid === MIOT_SERVICES.MAP.SIID) {
                        if (e.piid === MIOT_SERVICES.MAP.PROPERTIES.MAP_DATA.PIID) {
                            //intentional since these will only be P-Frames which are unsupported (yet?)
                        } else {
                            Logger.warn("Unhandled Map property change ", e);
                        }
                    } else {
                        Logger.warn("Unhandled property change ", e);
                    }
                });
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
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.STATUS.PIID
            },
            {
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID
            },
            {
                siid: MIOT_SERVICES.BATTERY.SIID,
                piid: MIOT_SERVICES.BATTERY.PROPERTIES.LEVEL.PIID
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


    parseAndUpdateState(data) {
        if (!Array.isArray(data)) {
            Logger.error("Received non-array state", data);
            return;
        }


        data.forEach(elem => {
            if (elem.siid === MIOT_SERVICES.VACUUM_2.SIID) {
                if (elem.piid === MIOT_SERVICES.VACUUM_2.PROPERTIES.STATUS.PIID) {
                    let statusValue = STATUS_MAP[elem.value].value;
                    let statusFlag = STATUS_MAP[elem.value].flag;
                    let statusMetaData = {};

                    const newState = new stateAttrs.StatusStateAttribute({
                        value: statusValue,
                        flag: statusFlag,
                        metaData: statusMetaData
                    });

                    this.state.upsertFirstMatchingAttribute(newState);

                    if (newState.isActiveState) {
                        this.pollMap();
                    }
                } else if (elem.piid === MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID) {
                    let matchingFanSpeed = Object.keys(FAN_SPEEDS).find(key => FAN_SPEEDS[key] === elem.value);

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.IntensityStateAttribute({
                        type: stateAttrs.IntensityStateAttribute.TYPE.FAN_SPEED,
                        value: matchingFanSpeed
                    }));
                }
            } else if (elem.siid === MIOT_SERVICES.BATTERY.SIID) {
                if (elem.piid === MIOT_SERVICES.BATTERY.PROPERTIES.LEVEL.PIID) {
                    this.state.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                        level: elem.value
                    }));
                }
            } else {
                Logger.warn("Unhandled property update", elem);
            }
        });

        this.emitStateUpdated();
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
                    siid: MIOT_SERVICES.MAP.SIID,
                    aiid: MIOT_SERVICES.MAP.ACTION.POLL.AIID,
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
                    repollSeconds = 4;
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

    getModelName() {
        return "D9";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameD9ValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2009");
    }
}

DreameD9ValetudoRobot.DEVICE_CONF_PATH = "/data/config/miio/device.conf";
DreameD9ValetudoRobot.TOKEN_FILE_PATH = "/data/config/miio/device.token";

const STATUS_MAP = Object.freeze({
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
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING, //TODO: maybe this is segment?
        flag: stateAttrs.StatusStateAttribute.FLAG.ZONE
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

const FAN_SPEEDS = {
    [stateAttrs.IntensityStateAttribute.VALUE.LOW]: 0,
    [stateAttrs.IntensityStateAttribute.VALUE.MEDIUM]: 1,
    [stateAttrs.IntensityStateAttribute.VALUE.HIGH]: 2,
    [stateAttrs.IntensityStateAttribute.VALUE.MAX]: 3
};


module.exports = DreameD9ValetudoRobot;
