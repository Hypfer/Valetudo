const capabilities = require("./capabilities");
const fs = require("fs");
const Logger = require("../../Logger");
const RoborockConst = require("./RoborockConst");
const RoborockMapParser = require("./RoborockMapParser");

const DustBinFullValetudoEvent = require("../../valetudo_events/events/DustBinFullValetudoEvent");
const entities = require("../../entities");
const LinuxTools = require("../../utils/LinuxTools");
const LinuxWifiScanCapability = require("../common/linuxCapabilities/LinuxWifiScanCapability");
const MapLayer = require("../../entities/map/MapLayer");
const MiioDummycloudNotConnectedError = require("../../miio/MiioDummycloudNotConnectedError");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const PendingMapChangeValetudoEvent = require("../../valetudo_events/events/PendingMapChangeValetudoEvent");
const ValetudoMap = require("../../entities/map/ValetudoMap");
const ValetudoRobotError = require("../../entities/core/ValetudoRobotError");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");

const stateAttrs = entities.state.attributes;

class RoborockValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {import("../../ValetudoEventStore")} options.valetudoEventStore
     * @param {object} options.fanSpeeds
     * @param {object} [options.waterGrades]
     * @param {Array<import("../../entities/state/attributes/AttachmentStateAttribute").AttachmentStateAttributeType>} [options.supportedAttachments]
     * @param {import("./RoborockConst").DOCK_TYPE} [options.dockType]
     */
    constructor(options) {
        super(options);

        this.mapPollMiioCommand = MAP_POLL_COMMANDS.GetFreshMap;
        this.fanSpeeds = options.fanSpeeds;
        this.waterGrades = options.waterGrades ?? {};
        this.supportedAttachments = options.supportedAttachments ?? [];
        this.dockType = options.dockType ?? RoborockConst.DOCK_TYPE.CHARGING;

        this.supportedAttachments.forEach(attachmentType => {
            this.state.upsertFirstMatchingAttribute(new entities.state.attributes.AttachmentStateAttribute({
                type: attachmentType,
                attached: false
            }));
        });

        this.registerCapability(new capabilities.RoborockFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(this.fanSpeeds).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.fanSpeeds[k]});
            })
        }));

        this.registerCapability(new capabilities.RoborockConsumableMonitoringCapability({
            robot: this,
            dockType: this.dockType
        }));

        [
            capabilities.RoborockBasicControlCapability,
            capabilities.RoborockZoneCleaningCapability,
            capabilities.RoborockGoToLocationCapability,
            capabilities.RoborockLocateCapability,
            capabilities.RoborockDoNotDisturbCapability,
            capabilities.RoborockCarpetModeControlCapability,
            capabilities.RoborockSpeakerVolumeControlCapability,
            capabilities.RoborockSpeakerTestCapability,
            capabilities.RoborockVoicePackManagementCapability,
            capabilities.RoborockTotalStatisticsCapability,
            capabilities.RoborockCurrentStatisticsCapability,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.registerCapability(new capabilities.RoborockWifiConfigurationCapability({
            robot: this,
            networkInterface: "wlan0"
        }));

        if (this.config.get("embedded") === true) {
            this.registerCapability(new LinuxWifiScanCapability({
                robot: this,
                networkInterface: "wlan0"
            }));
        }

        if (this.dockType === RoborockConst.DOCK_TYPE.ULTRA) {
            this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
                value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
            }));
        }
    }

    setEmbeddedParameters() {
        this.deviceConfPath = RoborockValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = RoborockValetudoRobot.TOKEN_FILE_PATH;
    }


    onIncomingCloudMessage(msg) {
        switch (msg.method) {
            case "props":
                this.parseAndUpdateState(msg.params);

                this.sendCloud({id: msg.id, "result":"ok"}).catch((err) => {
                    Logger.warn("Error while sending cloud ack", err);
                });

                return true;
            case "event.status":
                if (msg.params &&
                    msg.params[0] &&
                    msg.params[0].state !== undefined
                ) {
                    this.parseAndUpdateState(msg.params[0]);
                }

                this.sendCloud({id: msg.id, "result":"ok"}).catch((err) => {
                    Logger.warn("Error while sending cloud ack", err);
                });

                return true;
            case "_sync.getctrycode":
                this.sendCloud({
                    id: msg.id, result: {ctry_code: "DE"} //TODO
                }).catch(e => {
                    Logger.warn(`Error while responding to ${msg.method}`, e);
                });

                return true;
            case "_sync.getAppData":
                this.sendCloud({
                    id: msg.id,
                    error: {
                        code: -6,
                        message: "not set app data"
                    }
                }).catch(e => {
                    Logger.warn(`Error while responding to ${msg.method}`, e);
                });


                return true;
            // Roborock does not use the common presigned URL implementation, it requires this specific format.
            case "_sync.gen_tmp_presigned_url":
            case "_sync.gen_presigned_url":
            case "_sync.batch_gen_room_up_url": {
                const filename = msg.method === "_sync.batch_gen_room_up_url" ? "room_map" : "map";

                let mapUploadUrls = [];

                if (Array.isArray(msg.params?.indexes)) {
                    msg.params.indexes.forEach(idx => {
                        mapUploadUrls.push(
                            `${this.mapUploadUrlPrefix}/api/miio/fds_upload_handler/${filename}_${idx}?${process.hrtime().toString().replace(/,/g, "")}`
                        );
                    });
                } else {
                    for (let i = 0; i < 4; i++) {
                        mapUploadUrls.push(
                            `${this.mapUploadUrlPrefix}/api/miio/fds_upload_handler/${filename}_${i}?${process.hrtime().toString().replace(/,/g, "")}`
                        );
                    }
                }

                this.sendCloud({id: msg.id, result: mapUploadUrls}).catch(e => {
                    Logger.warn(`Error while responding to ${msg.method}`, e);
                });


                return true;
            }

            case "event.bin_full":
                this.valetudoEventStore.raise(new DustBinFullValetudoEvent({}));

                this.sendCloud({id: msg.id, "result":"ok"}).catch((err) => {
                    Logger.warn("Error while sending cloud ack", err);
                });

                return true;
            case "event.remind_to_save_map":
                this.valetudoEventStore.raise(new PendingMapChangeValetudoEvent({}));

                this.sendCloud({id: msg.id, "result":"ok"}).catch((err) => {
                    Logger.warn("Error while sending cloud ack", err);
                });

                return true;

            case "event.segment_map_done":
                this.pollMap();
                this.pollState().catch((err) => {
                    Logger.warn("Error while polling state after map split", err);
                });

                this.sendCloud({id: msg.id, "result":"ok"}).catch((err) => {
                    Logger.warn("Error while sending cloud ack", err);
                });

                return true;
            case "event.back_to_dock":
            case "event.error_code":
            case "event.relocate_failed_back":
            case "event.goto_target_succ":
            case "event.target_not_reachable":
            case "event.consume_material_notify":
            case "event.clean_complete":
            case "event.segment_clean_succ":
            case "event.segment_clean_part_done":
            case "event.zoned_clean_succ":
            case "event.zoned_clean_partial_done":
            case "event.zoned_clean_failed":
            case "event.relocate_fail":
            case "event.fan_power_reduced":
            case "event.low_power_back": //If the robot is currently cleaning and the battery drops below 20% it drives home to charge
            case "event.start_with_water_box":
            case "event.back_to_origin_fail":
            case "event.back_to_origin_succ":
                this.sendCloud({id: msg.id, "result":"ok"}).catch((err) => {
                    Logger.warn("Error while sending cloud ack", err);
                });

                return true;
        }

        // noinspection RedundantIfStatementJS
        if (msg.id === 0 && msg.result === "unknown_method") {
            // On the S5 Max fw 1566 and probably other robots and firmwares, we receive this on startup
            // It's probably an artifact of the miio_client downgrade
            // => We'll just silently ignore it

            return true;
        }

        return false;
    }

    async pollState() {
        const response = await this.sendCommand("get_status", {});

        if (response) {
            this.parseAndUpdateState(response[0]);
        }

        return this.state;
    }


    //TODO: viomi repolls the map on status change to quick poll states. We probably should do the same
    parseAndUpdateState(data) {
        let newStateAttr;

        if (this.dockType === RoborockConst.DOCK_TYPE.ULTRA) {
            if (data["state"] !== undefined) {
                switch (data["state"]) {
                    case 23:
                    case 25:
                    case 26:
                        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
                            value: entities.state.attributes.DockStatusStateAttribute.VALUE.CLEANING
                        }));
                        break;
                    default:
                        this.state.upsertFirstMatchingAttribute(new entities.state.attributes.DockStatusStateAttribute({
                            value: entities.state.attributes.DockStatusStateAttribute.VALUE.IDLE
                        }));
                }
            }
        }

        if (data["state"] !== undefined && STATUS_MAP[data["state"]]) {
            let statusValue = STATUS_MAP[data["state"]].value;
            let statusFlag = STATUS_MAP[data["state"]].flag;
            let statusError = undefined;
            let statusMetaData = {};

            if (
                data["in_cleaning"] !== 0 &&
                (
                    statusValue === stateAttrs.StatusStateAttribute.VALUE.PAUSED ||
                    statusValue === stateAttrs.StatusStateAttribute.VALUE.RETURNING ||
                    statusValue === stateAttrs.StatusStateAttribute.VALUE.DOCKED
                )
            ) {
                statusFlag = stateAttrs.StatusStateAttribute.FLAG.RESUMABLE;

                if (data["in_cleaning"] === undefined) {
                    const previousState = this.state.getFirstMatchingAttributeByConstructor(stateAttrs.StatusStateAttribute);

                    // keep statusFlag and metaData from previous state
                    if (previousState &&
                        (
                            previousState.value === stateAttrs.StatusStateAttribute.VALUE.PAUSED ||
                            previousState.value === stateAttrs.StatusStateAttribute.VALUE.RETURNING ||
                            previousState.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED
                        )
                    ) {
                        statusFlag = previousState.flag;

                        if (previousState.metaData.zoned === true) {
                            statusMetaData.zoned = true;
                        } else if (previousState.metaData.segment_cleaning === true) {
                            statusMetaData.segment_cleaning = true;
                        }
                    }
                } else if (data["in_cleaning"] === 2) {
                    //Since this is some roborock-related weirdness, we're using the metaData to store this
                    statusMetaData.zoned = true;
                } else if (data["in_cleaning"] === 3) {
                    statusMetaData.segment_cleaning = true;
                }
            } else if (statusValue === stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                statusError = RoborockValetudoRobot.MAP_ERROR_CODE(data["error_code"]);
            }

            newStateAttr = new stateAttrs.StatusStateAttribute({
                value: statusValue,
                flag: statusFlag,
                error: statusError,
                metaData: statusMetaData
            });

            this.state.upsertFirstMatchingAttribute(newStateAttr);

            if (newStateAttr.isActiveState) {
                this.pollMap();
            }
        }

        if (data["battery"] !== undefined) {
            let previousBatteryAttr = this.state.getFirstMatchingAttributeByConstructor(stateAttrs.BatteryStateAttribute);
            let flag = stateAttrs.BatteryStateAttribute.FLAG.NONE;
            let level = data["battery"] ?? 0;


            if (newStateAttr) {
                if (newStateAttr.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED) {
                    if (level === 100) {
                        flag = stateAttrs.BatteryStateAttribute.FLAG.CHARGED;
                    } else {
                        flag = stateAttrs.BatteryStateAttribute.FLAG.CHARGING;
                    }
                } else {
                    flag = stateAttrs.BatteryStateAttribute.FLAG.DISCHARGING;
                }
            } else if (previousBatteryAttr) {
                flag = previousBatteryAttr.flag;
            }

            this.state.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                level: level,
                flag: flag
            }));
        }

        if (data["clean_area"] !== undefined) {
            this.capabilities[capabilities.RoborockCurrentStatisticsCapability.TYPE].currentStatistics.area = Math.round(parseInt(data["clean_area"]) / 100);
        }
        if (data["clean_time"] !== undefined) {
            this.capabilities[capabilities.RoborockCurrentStatisticsCapability.TYPE].currentStatistics.time = parseInt(data["clean_time"]);
        }

        if (data["lab_status"] !== undefined && this.hasCapability(capabilities.RoborockPersistentMapControlCapability.TYPE)) {
            /*
                lab_status is a byte that consists of

                XXXXXXMP

                X is currently (2022-02-21) unused
                M is the multi-map flag
                P is the persistent-map flag
             */

            this.labStatus = {
                persistentMapEnabled: !!(data["lab_status"] & 0b00000001),
                multiMapEnabled: !!(data["lab_status"] & 0b00000010)
            };
        }

        if (
            data["water_box_status"] !== undefined &&
            this.supportedAttachments.includes(stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK)
        ) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                type: stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
                attached: data["water_box_status"] === 1
            }));
        }

        if (
            data["water_box_carriage_status"] !== undefined &&
            this.supportedAttachments.includes(stateAttrs.AttachmentStateAttribute.TYPE.MOP)
        ) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                type: stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                attached: data["water_box_carriage_status"] === 1
            }));
        }

        //data["dnd_enabled"]
        //data["map_present"]

        if (data["fan_power"] !== undefined) {
            let matchingFanSpeed = Object.keys(this.fanSpeeds).find(key => {
                return this.fanSpeeds[key] === data["fan_power"];
            });
            if (!matchingFanSpeed) {
                matchingFanSpeed = stateAttrs.PresetSelectionStateAttribute.INTENSITY.CUSTOM;
            }

            this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                type: stateAttrs.PresetSelectionStateAttribute.TYPE.FAN_SPEED,
                value: matchingFanSpeed,
                customValue: matchingFanSpeed === stateAttrs.PresetSelectionStateAttribute.INTENSITY.CUSTOM ? data["fan_power"] : undefined
            }));
        }

        if (data["water_box_mode"] !== undefined) {
            let matchingWaterGrade = Object.keys(this.waterGrades).find(key => {
                return this.waterGrades[key] === data["water_box_mode"];
            });
            if (!matchingWaterGrade) {
                matchingWaterGrade = stateAttrs.PresetSelectionStateAttribute.INTENSITY.CUSTOM;
            }

            this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                type: stateAttrs.PresetSelectionStateAttribute.TYPE.WATER_GRADE,
                value: matchingWaterGrade,
                customValue: matchingWaterGrade === stateAttrs.PresetSelectionStateAttribute.INTENSITY.CUSTOM ? data["water_box_mode"] : undefined
            }));
        }

        if (data["map_status"] !== undefined) {
            /*
                map_status is a byte that consists of

                IIIIIISM

                I being all part of the current mapId 0-63
                S being a "segment present" flag
                M being a "map present" flag
             */

            this.mapStatus = {
                mapPresent: !!(data["map_status"] & 0b00000001),
                segmentsPresent: !!(data["map_status"] & 0b00000010),
                mapSlotId: data["map_status"] >> 2
            };
        }

        this.emitStateAttributesUpdated();
    }

    async executeMapPoll() {
        let result;
        try {
            result = await this.sendCommand(this.mapPollMiioCommand);

            if (result?.[0] === "retry" && this.mapPollMiioCommand === MAP_POLL_COMMANDS.GetFreshMap) {
                result = await this.sendCommand(MAP_POLL_COMMANDS.GetMap);
            }
        } catch (e) {
            if (!(e instanceof MiioDummycloudNotConnectedError)) {
                throw e;
            }
        }

        if (result === "unknown_method" && this.mapPollMiioCommand === MAP_POLL_COMMANDS.GetFreshMap) {
            Logger.warn(`"${this.mapPollMiioCommand}" is not supported by your firmware. Falling back to "${MAP_POLL_COMMANDS.GetMap}".`);
            this.mapPollMiioCommand = MAP_POLL_COMMANDS.GetMap;

            return this.executeMapPoll();
        }

        return result;
    }

    determineNextMapPollInterval(pollResponse) {
        let repollSeconds = super.determineNextMapPollInterval();

        if (pollResponse?.length === 1) {
            if (pollResponse && pollResponse[0] === "retry") {
                if (this.state.map?.metaData?.defaultMap !== true) {
                    repollSeconds += 1;
                } else {
                    // This fixes the map not being available on boot for another 60 seconds
                    repollSeconds = RoborockValetudoRobot.MAP_POLLING_INTERVALS.ACTIVE;
                }
            }
        }

        return repollSeconds;
    }

    preprocessMap(data) {
        return RoborockMapParser.PREPROCESS(data);
    }

    async parseMap(data) {
        const parsedMap = RoborockMapParser.PARSE(data);

        if (parsedMap instanceof ValetudoMap) {
            this.state.map = parsedMap;

            if (this.state.map.metaData?.vendorMapId !== this.vendorMapId) {
                this.vendorMapId = this.state.map.metaData?.vendorMapId;

                if (this.hasCapability(capabilities.RoborockMapSegmentRenameCapability.TYPE)) {
                    await this.capabilities[capabilities.RoborockMapSegmentRenameCapability.TYPE].fetchAndStoreSegmentNames();
                }
            }

            if (this.capabilities[capabilities.RoborockMapSegmentRenameCapability.TYPE]?.segmentNames) {
                this.state.map.layers.forEach(layer => {
                    if (layer.type === MapLayer.TYPE.SEGMENT) {
                        layer.metaData.name = this.capabilities[capabilities.RoborockMapSegmentRenameCapability.TYPE].segmentNames[layer.metaData.segmentId];
                    }
                });
            }

            this.emitMapUpdated();
        }

        return parsedMap;
    }

    startup() {
        super.startup();

        if (this.config.get("embedded") === true) {
            const firmwareVersion = this.getFirmwareVersion();

            if (firmwareVersion) {
                Logger.info("Firmware Version: " + firmwareVersion);
            }


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

    getManufacturer() {
        return "Roborock";
    }

    /**
     * @protected
     * @returns {string | null}
     */
    getFirmwareVersion() {
        try {
            const os_release = fs.readFileSync("/etc/os-release").toString();
            const parsedFile = /^ROBOROCK_VERSION=(?<version>[\d._]*)$/m.exec(os_release);

            if (parsedFile !== null && parsedFile.groups && parsedFile.groups.version) {
                return parsedFile.groups.version.split("_")?.[1];
            } else {
                Logger.warn("Unable to determine the Firmware Version");

                return null;
            }
        } catch (e) {
            Logger.warn("Unable to determine the Firmware Version", e);

            return null;
        }
    }

    getModelDetails() {
        return Object.assign(
            {},
            super.getModelDetails(),
            {
                supportedAttachments: this.supportedAttachments
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

            if (firmwareVersion) {
                ourProps[RoborockValetudoRobot.WELL_KNOWN_PROPERTIES.FIRMWARE_VERSION] = firmwareVersion;
            }
        }

        return Object.assign(
            {},
            superProps,
            ourProps
        );
    }
}

RoborockValetudoRobot.DEVICE_CONF_PATH = "/mnt/default/device.conf";
RoborockValetudoRobot.TOKEN_FILE_PATH = "/mnt/data/miio/device.token";


/** Device specific status code mapping. */
const STATUS_MAP = {
    1: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    2: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    3: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    4: {
        value: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    7: {
        value: stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    8: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    9: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    10: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED
    },
    11: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SPOT
    },
    12: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR
    },
    13: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    14: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    15: {
        //This confuses the map polling

        //Before, it was known as DOCKING.
        //Recently however, roborock started transparently mapping this to code 6
        //Why? Idk.
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    16: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING,
        flag: stateAttrs.StatusStateAttribute.FLAG.TARGET
    },
    17: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.ZONE
    },
    18: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING,
        flag: stateAttrs.StatusStateAttribute.FLAG.SEGMENT
    },
    23: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    25: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    26: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    29: {
        value: stateAttrs.StatusStateAttribute.VALUE.MOVING,
        flag: stateAttrs.StatusStateAttribute.FLAG.MAPPING
    },
    100: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    101: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR
    }
};

/**
 * 
 * @param {number} vendorErrorCode
 * 
 * @returns {ValetudoRobotError}
 */
RoborockValetudoRobot.MAP_ERROR_CODE = (vendorErrorCode) => {
    const parameters = {
        severity: {
            kind: ValetudoRobotError.SEVERITY_KIND.UNKNOWN,
            level: ValetudoRobotError.SEVERITY_LEVEL.UNKNOWN,
        },
        subsystem: ValetudoRobotError.SUBSYSTEM.UNKNOWN,
        message: `Unknown error ${vendorErrorCode}`,
        vendorErrorCode: typeof vendorErrorCode === "number" ? vendorErrorCode.toString() : `unknown (${vendorErrorCode})`
    };

    switch (vendorErrorCode) {
        case 0:
            parameters.message = "No error";
            break;
        case 1:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "LDS jammed";
            break;
        case 2:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Stuck front bumper";
            break;
        case 3:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
            parameters.message = "Wheel lost floor contact";
            break;
        case 4:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Cliff sensor dirty or robot on the verge of falling";
            break;
        case 5:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Main brush jammed";
            break;
        case 6:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Side brush jammed";
            break;
        case 7:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Wheel jammed";
            break;
        case 8:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
            parameters.message = "Robot stuck or trapped";
            break;
        case 9:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
            parameters.message = "Dustbin missing";
            break;
        case 10:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
            parameters.message = "Filter jammed";
            break;
        case 11:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Magnetic interference";
            break;
        case 12:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.INFO;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
            parameters.message = "Low battery";
            break;
        case 13:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
            parameters.message = "Charging error";
            break;
        case 14:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
            parameters.message = "Battery temperature out of operating range";
            break;
        case 15:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Wall sensor dirty";
            break;
        case 16:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Tilted robot";
            break;
        case 17:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Side brush error. Reboot required";
            break;
        case 18:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Fan error. Reboot required";
            break;
        case 19:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
            parameters.message = "Charging station without power";
            break;
        //20?
        case 21:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "LDS bumper jammed";
            break;
        case 22:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
            parameters.message = "Charging contacts dirty";
            break;
        case 23:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.ERROR;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
            parameters.message = "Charging station dirty";
            break;
        case 24:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.NAVIGATION;
            parameters.message = "Stuck inside restricted area";
            break;
        case 25:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Camera dirty";
            break;
        case 26:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Wall sensor dirty";
            break;
        case 27:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.ATTACHMENTS;
            parameters.message = "Mop module stuck";
            break;
        //28?
        case 29:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.TRANSIENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.UNKNOWN;
            parameters.message = "Animal excrements detected";
            break;

        case 32:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Auto-Empty Dock dustbin or dust bag missing";
            break;
        case 34:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Auto-Empty Dock filter clogged";
            break;

        case 35:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Auto-Empty Dock voltage abnormal";
            break;

        case 38:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Mop Dock Clean Water Tank empty or not installed";
            break;
        case 39:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Mop Dock Wastewater Tank full or not installed";
            break;
        case 40:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Mop Dock Water Filter not installed";
            break;
        case 41:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Mop Dock Clean Water Tank empty";
            break;
        case 42:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Mop Dock Cleaning Brush jammed";
            break;
        case 44:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.WARNING;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.DOCK;
            parameters.message = "Mop Dock Water Filter clogged";
            break;

        case 100:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.UNKNOWN;
            parameters.message = "Unknown hardware fault";
            break;
        case 101:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.UNKNOWN;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Compass fault";
            break;
        case 102:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.UNKNOWN;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Right compass fault";
            break;
        case 103:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Main brush short circuit";
            break;
        case 104:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Main brush open circuit";
            break;
        case 105:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Left wheel short circuit";
            break;
        case 106:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Left wheel open circuit";
            break;
        case 107:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Right wheel short circuit";
            break;
        case 108:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Right wheel open circuit";
            break;
        case 109:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.MOTORS;
            parameters.message = "Fan open circuit";
            break;
        case 110:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Motion tracking sensor initialization error";
            break;
        case 111:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Inertial measurement unit initialization error";
            break;
        case 112:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.POWER;
            parameters.message = "Charging uC fault";
            break;
        case 113:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
            parameters.message = "NVRAM fault";
            break;
        case 114:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
            parameters.message = "Wi-Fi module fault 1";
            break;
        case 115:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
            parameters.message = "Wi-Fi module fault 2";
            break;
        case 116:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Odometer fault";
            break;
        case 117:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Left odometer fault";
            break;
        case 118:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Right odometer fault";
            break;
        case 119:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.CORE;
            parameters.message = "Speaker fault";
            break;
        case 120:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Wall sensor initialization error";
            break;
        case 121:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Wall sensor fault";
            break;
        case 122:
            parameters.severity.kind = ValetudoRobotError.SEVERITY_KIND.PERMANENT;
            parameters.severity.level = ValetudoRobotError.SEVERITY_LEVEL.CATASTROPHIC;
            parameters.subsystem = ValetudoRobotError.SUBSYSTEM.SENSORS;
            parameters.message = "Wall sensor fault";
            break;
    }

    return new ValetudoRobotError(parameters);
};

const MAP_POLL_COMMANDS = Object.freeze({
    GetMap: "get_map_v1",
    GetFreshMap: "get_fresh_map_v1",
});

module.exports = RoborockValetudoRobot;
