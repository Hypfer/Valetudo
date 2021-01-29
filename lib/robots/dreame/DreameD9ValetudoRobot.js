const capabilities = require("./capabilities");

const MiioValetudoRobot = require("../MiioValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const ValetudoIntensityPreset = require("../../entities/core/ValetudoIntensityPreset");
const entities = require("../../entities");
const Logger = require("../../Logger");

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
            STATUS: { //TODO: maybe rename to mode?
                PIID: 1
            },
            FAN_SPEED: {
                PIID: 4
            },
            ADDITIONAL_CLEANUP_PROPERTIES: {
                PIID: 10
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
            },
            VIRTUAL_RESTRICTIONS: {
                PIID: 4
            },

            ACTION_RESULT: {
                PIID: 6
            }
        },
        ACTIONS: {
            POLL: {
                AIID: 1
            },
            EDIT: {
                AIID: 2
            }
        }
    }
});



class DreameD9ValetudoRobot extends DreameValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     */
    constructor(options) {
        super(
            Object.assign(
                {},
                options,
                {
                    miotServices: {
                        MAP: MIOT_SERVICES.MAP
                    }
                }
            )
        );

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
            presets: Object.keys(DreameValetudoRobot.FAN_SPEEDS).map(k => new ValetudoIntensityPreset({name: k, value: DreameValetudoRobot.FAN_SPEEDS[k]})),
            siid: MIOT_SERVICES.VACUUM_2.SIID,
            piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID
        }));

        this.registerCapability(new capabilities.DreameLocateCapability({
            robot: this,
            siid: MIOT_SERVICES.LOCATE.SIID,
            aiid: MIOT_SERVICES.LOCATE.ACTIONS.LOCATE.AIID
        }));

        this.registerCapability(new capabilities.DreameZoneCleaningCapability({
            robot: this,
            miot_actions: {
                start: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    aiid: MIOT_SERVICES.VACUUM_2.ACTIONS.START.AIID
                }
            },
            miot_properties: {
                mode: {
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.STATUS.PIID
                },
                additionalCleanupParameters: {
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
                }
            },
            zoneCleaningModeId: 19
        }));

        this.registerCapability(new capabilities.DreameMapSegmentationCapability({
            robot: this,
            miot_actions: {
                start: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    aiid: MIOT_SERVICES.VACUUM_2.ACTIONS.START.AIID
                }
            },
            miot_properties: {
                mode: {
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.STATUS.PIID
                },
                additionalCleanupParameters: {
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
                }
            },
            segmentCleaningModeId: 18
        }));

        this.registerCapability(new capabilities.DreameCombinedVirtualRestrictionsCapability({
            robot: this,
            miot_actions: {
                map_edit: {
                    siid: MIOT_SERVICES.MAP.SIID,
                    aiid: MIOT_SERVICES.MAP.ACTIONS.EDIT.AIID
                }
            },
            miot_properties: {
                virtualRestrictions: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.VIRTUAL_RESTRICTIONS.PIID
                },
                actionResult: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.ACTION_RESULT.PIID
                }
            }
        }));
    }

    onMessage(msg) {
        if (super.onMessage(msg) === true) {
            return true;
        }

        switch (msg.method) {
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

                //this.parseAndUpdateState(msg.params);
                this.sendCloud({id: msg.id, "result":["ok"]});
                return true;
            }
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
                    let statusValue = DreameValetudoRobot.STATUS_MAP[elem.value].value;
                    let statusFlag = DreameValetudoRobot.STATUS_MAP[elem.value].flag;
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
                    let matchingFanSpeed = Object.keys(DreameValetudoRobot.FAN_SPEEDS).find(key => DreameValetudoRobot.FAN_SPEEDS[key] === elem.value);

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

    getModelName() {
        return "D9";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.p2009");
    }
}


module.exports = DreameD9ValetudoRobot;
