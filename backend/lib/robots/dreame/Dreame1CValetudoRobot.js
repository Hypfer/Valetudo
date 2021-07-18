const capabilities = require("./capabilities");

const DreameValetudoRobot = require("./DreameValetudoRobot");
const entities = require("../../entities");
const Logger = require("../../Logger");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const stateAttrs = entities.state.attributes;

//https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:vacuum:0000A006:dreame-mc1808:1
const MIOT_SERVICES = Object.freeze({
    ERROR: {
        SIID: 22,
        PROPERTIES: {
            CODE: {
                PIID: 1
            }
        }
    },
    VACUUM_2: {
        SIID: 18,
        PROPERTIES: {
            MODE: {
                PIID: 1
            },
            FAN_SPEED: {
                PIID: 6
            },
            WATER_USAGE: {
                PIID: 20
            },
            WATER_TANK_ATTACHMENT: {
                PIID: 9
            },
            TASK_STATUS: {
                PIID: 18 // if robot has a task: value = 0
            },
            ADDITIONAL_CLEANUP_PROPERTIES: {
                PIID: 21
            },
            PERSISTENT_MAPS: {
                PIID: 23
            }
        },
        ACTIONS: {
            START: {
                AIID: 1
            },
            PAUSE: {
                AIID: 2
            }
        }
    },
    BATTERY: {
        SIID: 2,
        PROPERTIES: {
            LEVEL: {
                PIID: 1
            },
            CHARGING: {
                PIID: 2
            }
        },
        ACTIONS: {
            START_CHARGE: {
                AIID: 1
            }
        }
    },
    LOCATE: {
        SIID: 17,
        ACTIONS: {
            LOCATE: {
                AIID: 1
            },
            VOLUME_TEST: {
                AIID: 3
            }
        }
    },
    VOICE: {
        SIID: 24,
        PROPERTIES: {
            VOLUME: {
                PIID: 1
            },
            ACTIVE_VOICEPACK: {
                PIID: 3
            },
            URL: {
                PIID: 4
            },
            HASH: {
                PIID: 5
            },
            SIZE: {
                PIID: 6
            }
        },
        ACTIONS: {
            DOWNLOAD_VOICEPACK: {
                AIID: 2
            }
        }
    },
    AUDIO: {
        SIID: 7,
        PROPERTIES: {
            VOLUME: {
                PIID: 1
            }
        },
        ACTIONS: {
            VOLUME_TEST: {
                AIID: 3
            }
        }
    },
    MAIN_BRUSH: {
        SIID: 26,
        PROPERTIES: {
            TIME_LEFT: { //Hours
                PIID: 1
            },
            PERCENT_LEFT: {
                PIID: 2
            }
        },
        ACTIONS: {
            RESET: {
                AIID: 1
            }
        }
    },
    SIDE_BRUSH: {
        SIID: 28,
        PROPERTIES: {
            TIME_LEFT: { //Hours
                PIID: 1
            },
            PERCENT_LEFT: {
                PIID: 2
            }
        },
        ACTIONS: {
            RESET: {
                AIID: 1
            }
        }
    },
    FILTER: {
        SIID: 27,
        PROPERTIES: {
            TIME_LEFT: { //Hours
                PIID: 2
            },
            PERCENT_LEFT: {
                PIID: 1 //It's only swapped for the filter for some reason..
            }
        },
        ACTIONS: {
            RESET: {
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
            },
            CLOUD_FILE_NAME: {
                PIID: 3
            },
            MAP_DETAILS: {
                PIID: 4
            },

            ACTION_RESULT: {
                PIID: 6 //TODO: validate
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



class Dreame1CValetudoRobot extends DreameValetudoRobot {
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

        this.registerCapability(new capabilities.Dreame1CBasicControlCapability({
            robot: this,
            miot_actions: {
                start: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    aiid: MIOT_SERVICES.VACUUM_2.ACTIONS.START.AIID
                },
                stop: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    aiid: MIOT_SERVICES.VACUUM_2.ACTIONS.PAUSE.AIID
                },
                pause: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    aiid: MIOT_SERVICES.VACUUM_2.ACTIONS.PAUSE.AIID
                },
                home: {
                    siid: MIOT_SERVICES.BATTERY.SIID,
                    aiid: MIOT_SERVICES.BATTERY.ACTIONS.START_CHARGE.AIID
                }
            }
        }));

        this.registerCapability(new capabilities.DreameFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(DreameValetudoRobot.FAN_SPEEDS).map(k => new ValetudoSelectionPreset({name: k, value: DreameValetudoRobot.FAN_SPEEDS[k]})),
            siid: MIOT_SERVICES.VACUUM_2.SIID,
            piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID
        }));

        this.registerCapability(new capabilities.DreameWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(DreameValetudoRobot.WATER_GRADES).map(k => new ValetudoSelectionPreset({name: k, value: DreameValetudoRobot.WATER_GRADES[k]})),
            siid: MIOT_SERVICES.VACUUM_2.SIID,
            piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID
        }));

        this.registerCapability(new capabilities.DreameLocateCapability({
            robot: this,
            siid: MIOT_SERVICES.LOCATE.SIID,
            aiid: MIOT_SERVICES.LOCATE.ACTIONS.LOCATE.AIID
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
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.MODE.PIID
                },
                additionalCleanupParameters: {
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
                }
            },
            segmentCleaningModeId: 18
        }));

        this.registerCapability(new capabilities.DreameCombinedVirtualRestrictionsCapability({ //TODO: verify
            robot: this,
            miot_actions: {
                map_edit: {
                    siid: MIOT_SERVICES.MAP.SIID,
                    aiid: MIOT_SERVICES.MAP.ACTIONS.EDIT.AIID
                }
            },
            miot_properties: {
                mapDetails: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.MAP_DETAILS.PIID
                },
                actionResult: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.ACTION_RESULT.PIID
                }
            }
        }));

        this.registerCapability(new capabilities.DreameMapSegmentRenameCapability({
            robot: this,
            miot_actions: {
                map_edit: {
                    siid: MIOT_SERVICES.MAP.SIID,
                    aiid: MIOT_SERVICES.MAP.ACTIONS.EDIT.AIID
                }
            },
            miot_properties: {
                mapDetails: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.MAP_DETAILS.PIID
                },
                actionResult: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.ACTION_RESULT.PIID
                }
            }
        }));

        this.consumableMonitoringCapability = new capabilities.Dreame1CConsumableMonitoringCapability({
            robot: this,
            miot_properties: {
                main_brush: {
                    siid: MIOT_SERVICES.MAIN_BRUSH.SIID,
                    piid: MIOT_SERVICES.MAIN_BRUSH.PROPERTIES.TIME_LEFT.PIID
                },
                side_brush: {
                    siid: MIOT_SERVICES.SIDE_BRUSH.SIID,
                    piid: MIOT_SERVICES.SIDE_BRUSH.PROPERTIES.TIME_LEFT.PIID
                },
                filter: {
                    siid: MIOT_SERVICES.FILTER.SIID,
                    piid: MIOT_SERVICES.FILTER.PROPERTIES.TIME_LEFT.PIID
                }
            },
            miot_actions: {
                reset_main_brush: {
                    siid: MIOT_SERVICES.MAIN_BRUSH.SIID,
                    aiid: MIOT_SERVICES.MAIN_BRUSH.ACTIONS.RESET.AIID
                },
                reset_side_brush: {
                    siid: MIOT_SERVICES.SIDE_BRUSH.SIID,
                    aiid: MIOT_SERVICES.SIDE_BRUSH.ACTIONS.RESET.AIID
                },
                reset_filter: {
                    siid: MIOT_SERVICES.FILTER.SIID,
                    aiid: MIOT_SERVICES.FILTER.ACTIONS.RESET.AIID
                }
            }
        });
        this.registerCapability(this.consumableMonitoringCapability);

        //Looks like this is always enabled for LIDAR robots but a toggle for vSlam ones?
        this.registerCapability(new capabilities.DreamePersistentMapControlCapability({
            robot: this,
            siid: MIOT_SERVICES.VACUUM_2.SIID,
            piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.PERSISTENT_MAPS.PIID
        }));

        this.registerCapability(new capabilities.DreameMapResetCapability({
            robot: this,
            miot_actions: {
                map_edit: {
                    siid: MIOT_SERVICES.MAP.SIID,
                    aiid: MIOT_SERVICES.MAP.ACTIONS.EDIT.AIID
                }
            },
            miot_properties: {
                mapDetails: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.MAP_DETAILS.PIID
                },
                actionResult: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.ACTION_RESULT.PIID
                }
            }
        }));

        this.registerCapability(new capabilities.DreameMapSegmentEditCapability({
            robot: this,
            miot_actions: {
                map_edit: {
                    siid: MIOT_SERVICES.MAP.SIID,
                    aiid: MIOT_SERVICES.MAP.ACTIONS.EDIT.AIID
                }
            },
            miot_properties: {
                mapDetails: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.MAP_DETAILS.PIID
                },
                actionResult: {
                    piid: MIOT_SERVICES.MAP.PROPERTIES.ACTION_RESULT.PIID
                }
            }
        }));

        this.registerCapability(new capabilities.Dreame1CZoneCleaningCapability({
            robot: this,
            miot_actions: {
                start: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    aiid: MIOT_SERVICES.VACUUM_2.ACTIONS.START.AIID
                }
            },
            miot_properties: {
                mode: {
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.MODE.PIID
                },
                additionalCleanupParameters: {
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
                }
            },
            zoneCleaningModeId: 19
        }));

        this.registerCapability(new capabilities.DreameSpeakerVolumeControlCapability({
            robot: this,
            siid: MIOT_SERVICES.VOICE.SIID,
            piid: MIOT_SERVICES.VOICE.PROPERTIES.VOLUME.PIID
        }));

        this.registerCapability(new capabilities.DreameSpeakerTestCapability({
            robot: this,
            siid: MIOT_SERVICES.LOCATE.SIID,
            aiid: MIOT_SERVICES.LOCATE.ACTIONS.VOLUME_TEST.AIID
        }));

        this.registerCapability(new capabilities.Dreame1CVoicePackManagementCapability({
            robot: this,
            siid: MIOT_SERVICES.VOICE.SIID,
            aiid: MIOT_SERVICES.VOICE.ACTIONS.DOWNLOAD_VOICEPACK.AIID,
            hash_piid: MIOT_SERVICES.VOICE.PROPERTIES.HASH.PIID,
            url_piid:  MIOT_SERVICES.VOICE.PROPERTIES.URL.PIID,
            active_voicepack_piid: MIOT_SERVICES.VOICE.PROPERTIES.ACTIVE_VOICEPACK.PIID,
            size_piid: MIOT_SERVICES.VOICE.PROPERTIES.SIZE.PIID
        }));
    }

    onMessage(msg) {
        if (super.onMessage(msg) === true) {
            return true;
        }

        switch (msg.method) {
            case "properties_changed": {
                msg.params.forEach(e => {
                    switch (e.siid) {
                        case MIOT_SERVICES.MAP.SIID:
                            switch (e.piid) {
                                case MIOT_SERVICES.MAP.PROPERTIES.MAP_DATA.PIID:
                                    //intentional since these will only be P-Frames which are unsupported (yet?)
                                    break;
                                case MIOT_SERVICES.MAP.PROPERTIES.CLOUD_FILE_NAME.PIID:
                                    //intentionally left blank since we don't care about this
                                    break;
                                default:
                                    Logger.debug("Unhandled Map property change ", e);
                            }
                            break;
                        case MIOT_SERVICES.VACUUM_2.SIID:
                        case MIOT_SERVICES.BATTERY.SIID:
                        case MIOT_SERVICES.MAIN_BRUSH.SIID:
                        case MIOT_SERVICES.SIDE_BRUSH.SIID:
                        case MIOT_SERVICES.FILTER.SIID:
                            this.parseAndUpdateState([e]);
                            break;
                        default:
                            Logger.debug("Unhandled property change ", e);
                    }
                });

                this.sendCloud({id: msg.id, "result":"ok"});
                return true;
            }
            case "props":
                if (msg.params && msg.params.ota_state) {
                    this.sendCloud({id: msg.id, "result":"ok"});
                    return true;
                }
                break;
            case "event_occured": {
                switch (msg.params.siid) {
                    case MIOT_SERVICES.VACUUM_2.SIID:
                        this.parseAndUpdateState(msg.params.arguments.map(a => {
                            return {
                                siid: msg.params.siid,
                                piid: a.piid,
                                value: a.value
                            };
                        }));
                        this.sendCloud({id: msg.id, "result":"ok"});
                        break;
                    default:
                        Logger.debug("Unhandled event", msg);
                        this.sendCloud({id: msg.id, "result":"ok"});
                }

                return true;
            }
        }

        return false;
    }

    async pollState() {
        const response = await this.sendCommand("get_properties", [
            {
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.MODE.PIID
            },
            {
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.TASK_STATUS.PIID
            },
            {
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID
            },
            {
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID
            },
            {
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_TANK_ATTACHMENT.PIID
            },
            {
                siid: MIOT_SERVICES.ERROR.SIID,
                piid: MIOT_SERVICES.ERROR.PROPERTIES.CODE.PIID
            },
            {
                siid: MIOT_SERVICES.BATTERY.SIID,
                piid: MIOT_SERVICES.BATTERY.PROPERTIES.LEVEL.PIID
            },
            {
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.PERSISTENT_MAPS.PIID
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
            switch (elem.siid) {
                case MIOT_SERVICES.ERROR.SIID: {
                    this.errorCode = elem.value;

                    this.stateNeedsUpdate = true;
                    break;
                }
                case MIOT_SERVICES.VACUUM_2.SIID: {
                    switch (elem.piid) {
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.MODE.PIID: {
                            this.mode = elem.value;

                            this.stateNeedsUpdate = true;
                            break;
                        }
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.TASK_STATUS.PIID: {
                            this.taskStatus = elem.value;

                            this.stateNeedsUpdate = true;
                            break;
                        }
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID: {
                            let matchingFanSpeed = Object.keys(DreameValetudoRobot.FAN_SPEEDS).find(key => DreameValetudoRobot.FAN_SPEEDS[key] === elem.value);

                            this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                                metaData: {
                                    rawValue: elem.value
                                },
                                type: stateAttrs.PresetSelectionStateAttribute.TYPE.FAN_SPEED,
                                value: matchingFanSpeed
                            }));
                            break;
                        }

                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_USAGE.PIID: {
                            let matchingWaterGrade = Object.keys(DreameValetudoRobot.WATER_GRADES).find(key => DreameValetudoRobot.WATER_GRADES[key] === elem.value);

                            this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                                metaData: {
                                    rawValue: elem.value
                                },
                                type: stateAttrs.PresetSelectionStateAttribute.TYPE.WATER_GRADE,
                                value: matchingWaterGrade
                            }));
                            break;
                        }
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.WATER_TANK_ATTACHMENT.PIID: {
                            this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
                                type: entities.state.attributes.AttachmentStateAttribute.TYPE.WATERTANK,
                                attached: elem.value === 1
                            }));

                            this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
                                type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
                                attached: elem.value === 1
                            }));
                            break;
                        }
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.PERSISTENT_MAPS.PIID: {
                            this.state.upsertFirstMatchingAttribute(new entities.state.attributes.PersistentMapSettingStateAttribute({
                                value: elem.value === 1 ? entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.ENABLED :
                                    entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.DISABLED
                            }));
                            break;
                        }

                        default:
                            Logger.warn("Unhandled VACUUM_2 property", elem);
                    }
                    break;
                }
                case MIOT_SERVICES.BATTERY.SIID: {
                    switch (elem.piid) {
                        case MIOT_SERVICES.BATTERY.PROPERTIES.LEVEL.PIID:
                            this.state.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                                level: elem.value
                            }));
                            break;
                    }
                    break;
                }

                case MIOT_SERVICES.MAIN_BRUSH.SIID:
                case MIOT_SERVICES.SIDE_BRUSH.SIID:
                case MIOT_SERVICES.FILTER.SIID:
                    this.consumableMonitoringCapability.parseConsumablesMessage(elem);
                    break;


                default:
                    Logger.warn("Unhandled property update", elem);
            }
        });


        if (this.stateNeedsUpdate === true) {
            let newState;
            let statusValue;
            let statusFlag;
            let statusMetaData = {};

            if (this.errorCode === "0" || this.errorCode === "" || this.errorCode === 0 || this.errorCode === undefined) {
                statusValue = DreameValetudoRobot.STATUS_MAP[this.mode].value;
                statusFlag = DreameValetudoRobot.STATUS_MAP[this.mode].flag;

                if (statusValue === stateAttrs.StatusStateAttribute.VALUE.DOCKED && this.taskStatus === 0) {
                    // Robot has a pending task but is charging due to low battery and will resume when battery >= 80%
                    statusFlag = stateAttrs.StatusStateAttribute.FLAG.RESUMABLE;
                }
            } else {
                statusValue = stateAttrs.StatusStateAttribute.VALUE.ERROR;

                statusMetaData.error_code = this.errorCode;
                statusMetaData.error_description = DreameValetudoRobot.GET_ERROR_CODE_DESCRIPTION(this.errorCode);
            }

            newState = new stateAttrs.StatusStateAttribute({
                value: statusValue,
                flag: statusFlag,
                metaData: statusMetaData
            });

            this.state.upsertFirstMatchingAttribute(newState);

            if (newState.isActiveState) {
                this.pollMap();
            }

            this.stateNeedsUpdate = false;
        }



        this.emitStateAttributesUpdated();
    }

    getModelName() {
        return "1C";
    }

    static IMPLEMENTATION_AUTO_DETECTION_HANDLER() {
        const deviceConf = MiioValetudoRobot.READ_DEVICE_CONF(DreameValetudoRobot.DEVICE_CONF_PATH);

        return !!(deviceConf && ["dreame.vacuum.ma1808", "dreame.vacuum.mb1808", "dreame.vacuum.mc1808"].includes(deviceConf.model));
    }
}

module.exports = Dreame1CValetudoRobot;
