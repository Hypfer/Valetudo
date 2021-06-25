const capabilities = require("./capabilities");

const DreameValetudoRobot = require("./DreameValetudoRobot");
const entities = require("../../entities");
const Logger = require("../../Logger");
const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const stateAttrs = entities.state.attributes;

//This is taken from the D9 MIOT spec but it applies to many more
//https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:vacuum:0000A006:dreame-p2009:1
const MIOT_SERVICES = Object.freeze({
    DEVICE: {
        SIID: 1,
        PROPERTIES: {
            SERIAL_NUMBER: {
                PIID: 5
            }
        }
    },
    VACUUM_1: {
        SIID: 2,
        PROPERTIES: {
            STATUS: {
                PIID: 1
            },
            ERROR: {
                PIID: 2
            }
        },
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
            MODE: {
                PIID: 1
            },
            FAN_SPEED: {
                PIID: 4
            },
            WATER_USAGE: {
                PIID: 5
            },
            WATER_TANK_ATTACHMENT: {
                PIID: 6
            },
            ADDITIONAL_CLEANUP_PROPERTIES: {
                PIID: 10
            },
            CARPET_MODE: {
                PIID: 12
            },
            ERROR_CODE: {
                PIID: 18
            }
        },
        ACTIONS: {
            START: {
                AIID: 1
            },
            PAUSE: {
                AIID: 2
            },
            /*
              Unfortunately, this doesnt exist. at least on the d9
            STOP: {
                AIID: 3
            } */
        }
    },
    BATTERY: {
        SIID: 3,
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
    AUDIO: {
        SIID: 7,
        PROPERTIES: {
            VOLUME: {
                PIID: 1
            },
            ACTIVE_VOICEPACK: {
                PIID: 2
            },
            VOICEPACK_INSTALL_STATUS: {
                PIID: 3
            },
            INSTALL_VOICEPACK: {
                PIID: 4
            }
        },
        ACTIONS: {
            LOCATE: {
                AIID: 1
            },
            VOLUME_TEST: {
                AIID: 2
            }
        }
    },
    MAIN_BRUSH: {
        SIID: 9,
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
        SIID: 10,
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
        SIID: 11,
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
        SIID: 6,
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
    },
    PERSISTENT_MAPS: {
        SIID: 13,
        PROPERTIES: {
            ENABLED: {
                PIID: 1
            }
        }
    }
});



class DreameGen2ValetudoRobot extends DreameValetudoRobot {
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

        this.mode = 0; //Idle
        this.errorCode = "0";
        this.stateNeedsUpdate = false;

        this.registerCapability(new capabilities.DreameBasicControlCapability({
            robot: this,
            miot_actions: {
                start: {
                    siid: MIOT_SERVICES.VACUUM_1.SIID,
                    aiid: MIOT_SERVICES.VACUUM_1.ACTIONS.RESUME.AIID
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
            siid: MIOT_SERVICES.AUDIO.SIID,
            aiid: MIOT_SERVICES.AUDIO.ACTIONS.LOCATE.AIID
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
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.MODE.PIID
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
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.MODE.PIID
                },
                additionalCleanupParameters: {
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.ADDITIONAL_CLEANUP_PROPERTIES.PIID
                }
            },
            segmentCleaningModeId: 18
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

        this.registerCapability(new capabilities.DreameCombinedVirtualRestrictionsCapability({
            robot: this,
            supportedRestrictedZoneTypes: [
                ValetudoRestrictedZone.TYPE.REGULAR,
                ValetudoRestrictedZone.TYPE.MOP
            ],
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

        this.consumableMonitoringCapability = new capabilities.DreameConsumableMonitoringCapability({
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

        this.registerCapability(new capabilities.DreameSpeakerVolumeControlCapability({
            robot: this,
            siid: MIOT_SERVICES.AUDIO.SIID,
            piid: MIOT_SERVICES.AUDIO.PROPERTIES.VOLUME.PIID
        }));
        this.registerCapability(new capabilities.DreameSpeakerTestCapability({
            robot: this,
            siid: MIOT_SERVICES.AUDIO.SIID,
            aiid: MIOT_SERVICES.AUDIO.ACTIONS.VOLUME_TEST.AIID
        }));

        this.registerCapability(new capabilities.DreameVoicePackManagementCapability({
            robot: this,
            siid: MIOT_SERVICES.AUDIO.SIID,
            active_voicepack_piid: MIOT_SERVICES.AUDIO.PROPERTIES.ACTIVE_VOICEPACK.PIID,
            voicepack_install_status_piid: MIOT_SERVICES.AUDIO.PROPERTIES.VOICEPACK_INSTALL_STATUS.PIID,
            install_voicepack_piid: MIOT_SERVICES.AUDIO.PROPERTIES.INSTALL_VOICEPACK.PIID
        }));

        this.registerCapability(new capabilities.DreameCarpetModeControlCapability({
            robot: this,
            siid: MIOT_SERVICES.VACUUM_2.SIID,
            piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.CARPET_MODE.PIID
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.WATERTANK,
            attached: false
        }));

        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
            attached: false
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
                                    Logger.warn("Unhandled Map property change ", e);
                            }
                            break;
                        case MIOT_SERVICES.VACUUM_1.SIID:
                        case MIOT_SERVICES.VACUUM_2.SIID:
                        case MIOT_SERVICES.BATTERY.SIID:
                        case MIOT_SERVICES.MAIN_BRUSH.SIID:
                        case MIOT_SERVICES.SIDE_BRUSH.SIID:
                        case MIOT_SERVICES.FILTER.SIID:
                            this.parseAndUpdateState([e]);
                            break;
                        case MIOT_SERVICES.DEVICE.SIID:
                        case MIOT_SERVICES.AUDIO.SIID:
                        case 99: //This seems to be a duplicate of the device service
                            //Intentionally ignored
                            break;
                        default:
                            Logger.warn("Unhandled property change ", e);
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
                        Logger.warn("Unhandled event", msg);
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
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.ERROR_CODE.PIID
            },
            {
                siid: MIOT_SERVICES.BATTERY.SIID,
                piid: MIOT_SERVICES.BATTERY.PROPERTIES.LEVEL.PIID
            }
        ].map(e => {
            e.did = this.deviceId;

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
                case MIOT_SERVICES.VACUUM_1.SIID: {
                    //intentionally left blank since there's nothing here that isn't also in VACUUM_2
                    break;
                }

                case MIOT_SERVICES.VACUUM_2.SIID: {
                    switch (elem.piid) {
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.MODE.PIID: {
                            this.mode = elem.value;

                            this.stateNeedsUpdate = true;
                            break;
                        }
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.ERROR_CODE.PIID: {
                            this.errorCode = elem.value;

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

            if (this.errorCode === "0" || this.errorCode === "") {
                statusValue = DreameValetudoRobot.STATUS_MAP[this.mode].value;
                statusFlag = DreameValetudoRobot.STATUS_MAP[this.mode].flag;
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
}

DreameGen2ValetudoRobot.MIOT_SERVICES = MIOT_SERVICES;


module.exports = DreameGen2ValetudoRobot;
