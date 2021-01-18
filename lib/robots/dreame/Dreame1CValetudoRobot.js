const capabilities = require("./capabilities");

const MiioValetudoRobot = require("../MiioValetudoRobot");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const ValetudoIntensityPreset = require("../../entities/core/ValetudoIntensityPreset");
const entities = require("../../entities");
const Logger = require("../../Logger");

const stateAttrs = entities.state.attributes;

//https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:vacuum:0000A006:dreame-mc1808:1
const MIOT_SERVICES = Object.freeze({
    VACUUM: {
        SIID: 18,
        PROPERTIES: {
            STATUS: {
                PIID: 1
            },
            FAN_SPEED: {
                PIID: 6
            }
        },
        ACTIONS: {
            START: {
                AIID: 1
            },
            PAUSE: {
                AIID: 2
            },
            STOP: {
                AIID: 2
            }
        }
    },
    BATTERY: {
        SIID: 2,
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
    LOCATE: { //TODO: maybe rename to "play_sound"?
        SIID: 17,
        ACTIONS: {
            LOCATE: {
                AIID: 1
            }
        }
    },
    MAP: {
        SIID: 23,
        PROPERTIES: {
            MAP_DATA: {
                PIID: 1
            },
            FRAME_TYPE: { //Can be char I or P (numbers)
                PIID: 2
            }
        },
        ACTIONS: {
            POLL: {
                AIID: 1
            },
            IDK_MAYBE_EDIT: { //TODO
                AIID: 2
            }
        }
    }
});



class Dreame1CValetudoRobot extends MiioValetudoRobot {
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
                    siid: MIOT_SERVICES.VACUUM.SIID,
                    aiid: MIOT_SERVICES.VACUUM.ACTIONS.START.AIID
                },
                stop: {
                    siid: MIOT_SERVICES.VACUUM.SIID,
                    aiid: MIOT_SERVICES.VACUUM.ACTIONS.STOP.AIID
                },
                pause: {
                    siid: MIOT_SERVICES.VACUUM.SIID,
                    aiid: MIOT_SERVICES.VACUUM.ACTIONS.PAUSE.AIID
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
            siid: MIOT_SERVICES.VACUUM.SIID,
            piid: MIOT_SERVICES.VACUUM.PROPERTIES.FAN_SPEED.PIID
        }));

        this.registerCapability(new capabilities.DreameLocateCapability({
            robot: this,
            siid: MIOT_SERVICES.LOCATE.SIID,
            aiid: MIOT_SERVICES.LOCATE.ACTIONS.LOCATE.AIID
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
                siid: MIOT_SERVICES.VACUUM.SIID,
                piid: MIOT_SERVICES.VACUUM.PROPERTIES.STATUS.PIID
            },
            {
                siid: MIOT_SERVICES.VACUUM.SIID,
                piid: MIOT_SERVICES.VACUUM.PROPERTIES.FAN_SPEED.PIID
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
            if (elem.siid === MIOT_SERVICES.VACUUM.SIID) {
                if (elem.piid === MIOT_SERVICES.VACUUM.PROPERTIES.STATUS.PIID) {
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
                } else if (elem.piid === MIOT_SERVICES.VACUUM.PROPERTIES.FAN_SPEED.PIID) {
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
        return "1C";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && deviceConf.model === "dreame.vacuum.mc1808");
    }
}

module.exports = Dreame1CValetudoRobot;
