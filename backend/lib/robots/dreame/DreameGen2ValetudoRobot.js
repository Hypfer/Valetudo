const capabilities = require("./capabilities");

const ConsumableMonitoringCapability = require("../../core/capabilities/ConsumableMonitoringCapability");
const DreameMiotServices = require("./DreameMiotServices");
const DreameValetudoRobot = require("./DreameValetudoRobot");
const entities = require("../../entities");
const LinuxTools = require("../../utils/LinuxTools");
const Logger = require("../../Logger");
const MopAttachmentReminderValetudoEvent = require("../../valetudo_events/events/MopAttachmentReminderValetudoEvent");
const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const stateAttrs = entities.state.attributes;


const MIOT_SERVICES = DreameMiotServices["GEN2"];



class DreameGen2ValetudoRobot extends DreameValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
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

        /** @type {Array<{siid: number, piid: number, did: number}>} */
        this.statePropertiesToPoll = this.getStatePropertiesToPoll().map(e => {
            return {
                siid: e.siid,
                piid: e.piid,
                did:  this.deviceId
            };
        });

        this.lastMapPoll = new Date(0);

        this.mode = 0; //Idle
        this.isCharging = false;
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
            presets: Object.keys(DreameValetudoRobot.FAN_SPEEDS).map(k => {
                return new ValetudoSelectionPreset({name: k, value: DreameValetudoRobot.FAN_SPEEDS[k]});
            }),
            siid: MIOT_SERVICES.VACUUM_2.SIID,
            piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID
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
            segmentCleaningModeId: 18,
            iterationsSupported: 4,
            customOrderSupported: true
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

        this.registerCapability(new capabilities.DreamePendingMapChangeHandlingCapability({
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

        this.registerCapability(new capabilities.DreameManualControlCapability({
            robot: this,
            miot_properties: {
                manual_control: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.MANUAL_CONTROL.PIID
                }
            }
        }));

        this.registerCapability(new capabilities.DreameDoNotDisturbCapability({
            robot: this,
            miot_properties: {
                dnd_enabled: {
                    siid: MIOT_SERVICES.DND.SIID,
                    piid: MIOT_SERVICES.DND.PROPERTIES.ENABLED.PIID
                },
                dnd_start_time: {
                    siid: MIOT_SERVICES.DND.SIID,
                    piid: MIOT_SERVICES.DND.PROPERTIES.START_TIME.PIID
                },
                dnd_end_time: {
                    siid: MIOT_SERVICES.DND.SIID,
                    piid: MIOT_SERVICES.DND.PROPERTIES.END_TIME.PIID
                }
            }
        }));

        this.registerCapability(new capabilities.DreameTotalStatisticsCapability({
            robot: this,
            miot_properties: {
                time: {
                    siid: MIOT_SERVICES.TOTAL_STATISTICS.SIID,
                    piid: MIOT_SERVICES.TOTAL_STATISTICS.PROPERTIES.TIME.PIID
                },
                area: {
                    siid: MIOT_SERVICES.TOTAL_STATISTICS.SIID,
                    piid: MIOT_SERVICES.TOTAL_STATISTICS.PROPERTIES.AREA.PIID
                },
                count: {
                    siid: MIOT_SERVICES.TOTAL_STATISTICS.SIID,
                    piid: MIOT_SERVICES.TOTAL_STATISTICS.PROPERTIES.COUNT.PIID
                }
            }
        }));

        this.registerCapability(new capabilities.DreameCurrentStatisticsCapability({
            robot: this,
            miot_properties: {
                time: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.CLEANING_TIME.PIID
                },
                area: {
                    siid: MIOT_SERVICES.VACUUM_2.SIID,
                    piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.CLEANING_AREA.PIID
                }
            }
        }));


        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
            type: entities.state.attributes.AttachmentStateAttribute.TYPE.MOP,
            attached: false
        }));
    }

    onIncomingCloudMessage(msg) {
        if (super.onIncomingCloudMessage(msg) === true) {
            return true;
        }

        switch (msg.method) {
            case "properties_changed": {
                msg.params.forEach(e => {
                    switch (e.siid) {
                        case MIOT_SERVICES.MAP.SIID:
                            switch (e.piid) {
                                case MIOT_SERVICES.MAP.PROPERTIES.MAP_DATA.PIID:
                                    /*
                                        Most of the time, these will be P-Frames, which Valetudo ignores, however
                                        sometimes, they may be I-Frames as well. Usually that's right when a new map
                                        is being created, as then the map data is small enough to fit into a miio msg
                                     */
                                    this.preprocessAndParseMap(e.value).catch(err => {
                                        Logger.warn("Error while trying to parse map update", err);
                                    });
                                    break;
                                case MIOT_SERVICES.MAP.PROPERTIES.CLOUD_FILE_NAME.PIID:
                                case MIOT_SERVICES.MAP.PROPERTIES.CLOUD_FILE_NAME_2.PIID:
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
                        case MIOT_SERVICES.SENSOR.SIID:
                        case MIOT_SERVICES.MOP.SIID:
                        case MIOT_SERVICES.SECONDARY_FILTER.SIID:
                            this.parseAndUpdateState([e]);
                            break;
                        case MIOT_SERVICES.DEVICE.SIID:
                        case 99: //This seems to be a duplicate of the device service
                            //Intentionally ignored
                            break;
                        case MIOT_SERVICES.AUDIO.SIID:
                        case MIOT_SERVICES.DND.SIID:
                        case MIOT_SERVICES.PERSISTENT_MAPS.SIID:
                            //Intentionally ignored since we only poll that info when required and therefore don't care about updates
                            break;
                        case MIOT_SERVICES.AUTO_EMPTY_DOCK.SIID:
                        case MIOT_SERVICES.TIMERS.SIID:
                            //Intentionally left blank (for now?)
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
                // This is sent by the robot after a cleanup has finished.
                // It will contain the parameters of that past cleanup
                // Therefore, we ignore it in our current status

                this.sendCloud({id: msg.id, "result":"ok"});
                return true;
            }
        }

        return false;
    }

    /**
     * May be extended by children
     * 
     * @return {Array<{piid: number, siid: number}>}
     */
    getStatePropertiesToPoll() {
        return [
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
                siid: MIOT_SERVICES.VACUUM_2.SIID,
                piid: MIOT_SERVICES.VACUUM_2.PROPERTIES.ERROR_CODE.PIID
            },
            {
                siid: MIOT_SERVICES.BATTERY.SIID,
                piid: MIOT_SERVICES.BATTERY.PROPERTIES.LEVEL.PIID
            },
            {
                siid: MIOT_SERVICES.BATTERY.SIID,
                piid: MIOT_SERVICES.BATTERY.PROPERTIES.CHARGING.PIID
            }
        ];
    }

    async pollState() {
        const response = await this.sendCommand(
            "get_properties",
            this.statePropertiesToPoll
        );

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
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.TASK_STATUS.PIID: {
                            this.taskStatus = elem.value;

                            this.stateNeedsUpdate = true;
                            break;
                        }
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.FAN_SPEED.PIID: {
                            let matchingFanSpeed = Object.keys(DreameValetudoRobot.FAN_SPEEDS).find(key => {
                                return DreameValetudoRobot.FAN_SPEEDS[key] === elem.value;
                            });

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
                            let matchingWaterGrade = Object.keys(DreameValetudoRobot.WATER_GRADES).find(key => {
                                return DreameValetudoRobot.WATER_GRADES[key] === elem.value;
                            });

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
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.CLEANING_TIME.PIID:
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.CLEANING_AREA.PIID:
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.STATE_CHANGE_TIMESTAMP.PIID:
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.UNKNOWN_01.PIID:
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.LOCATING_STATUS.PIID:
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.CARPET_MODE.PIID:
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.KEY_LOCK.PIID:
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.OBSTACLE_AVOIDANCE.PIID:
                        case MIOT_SERVICES.VACUUM_2.PROPERTIES.MOP_DOCK_STATE.PIID:
                            //ignored for now
                            break;

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
                        case MIOT_SERVICES.BATTERY.PROPERTIES.CHARGING.PIID:
                            /*
                                1 = On Charger
                                2 = Not on Charger
                                5 = Returning to Charger
                             */
                            this.isCharging = elem.value === 1;
                            this.stateNeedsUpdate = true;
                            break;
                    }
                    break;
                }

                case MIOT_SERVICES.MAIN_BRUSH.SIID:
                case MIOT_SERVICES.SIDE_BRUSH.SIID:
                case MIOT_SERVICES.FILTER.SIID:
                case MIOT_SERVICES.SENSOR.SIID:
                case MIOT_SERVICES.MOP.SIID:
                case MIOT_SERVICES.SECONDARY_FILTER.SIID:
                    if (this.capabilities[ConsumableMonitoringCapability.TYPE]) {
                        this.capabilities[ConsumableMonitoringCapability.TYPE].parseConsumablesMessage(elem);
                    }
                    break;
                default:
                    Logger.warn("Unhandled property update", elem);
            }
        });


        if (this.stateNeedsUpdate === true) {
            let newState;
            let statusValue;
            let statusFlag;
            let statusError;
            let statusMetaData = {};

            if (this.errorCode === "0" || this.errorCode === "") {
                statusValue = DreameValetudoRobot.STATUS_MAP[this.mode].value;
                statusFlag = DreameValetudoRobot.STATUS_MAP[this.mode].flag;

                if (statusValue === stateAttrs.StatusStateAttribute.VALUE.DOCKED && this.taskStatus !== 0) {
                    // Robot has a pending task but is charging due to low battery and will resume when battery >= 80%
                    statusFlag = stateAttrs.StatusStateAttribute.FLAG.RESUMABLE;
                } else if (statusValue === stateAttrs.StatusStateAttribute.VALUE.IDLE && statusFlag === undefined && this.isCharging === true) {
                    statusValue = stateAttrs.StatusStateAttribute.VALUE.DOCKED;
                }
            } else {
                if (this.errorCode === "68") { //Docked with mop still attached. For some reason, dreame decided to have this as an error
                    statusValue = stateAttrs.StatusStateAttribute.VALUE.DOCKED;
                    this.valetudoEventStore.raise(new MopAttachmentReminderValetudoEvent({}));
                } else {
                    statusValue = stateAttrs.StatusStateAttribute.VALUE.ERROR;

                    statusError = DreameValetudoRobot.MAP_ERROR_CODE(this.errorCode);
                }

            }

            newState = new stateAttrs.StatusStateAttribute({
                value: statusValue,
                flag: statusFlag,
                metaData: statusMetaData,
                error: statusError
            });

            this.state.upsertFirstMatchingAttribute(newState);

            if (newState.isActiveState) {
                this.pollMap();
            }

            this.stateNeedsUpdate = false;
        }



        this.emitStateAttributesUpdated();
    }

    startup() {
        super.startup();

        if (this.config.get("embedded") === true) {
            try {
                const parsedCmdline = LinuxTools.READ_PROC_CMDLINE();

                if (parsedCmdline.partitions[parsedCmdline.root]) {
                    Logger.info(`Current rootfs: ${parsedCmdline.partitions[parsedCmdline.root]} (${parsedCmdline.root})`);
                }
            } catch (e) {
                Logger.warn("Unable to read /proc/cmdline", e);
            }
        }
    }
}

DreameGen2ValetudoRobot.MIOT_SERVICES = MIOT_SERVICES;


module.exports = DreameGen2ValetudoRobot;
