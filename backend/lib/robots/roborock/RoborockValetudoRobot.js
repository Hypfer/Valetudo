const capabilities = require("./capabilities");
const fs = require("fs");
const Logger = require("../../Logger");
const RRMapParser = require("./RRMapParser");
const zlib = require("zlib");

const DustBinFullValetudoEvent = require("../../valetudo_events/events/DustBinFullValetudoEvent");
const entities = require("../../entities");
const MapLayer = require("../../entities/map/MapLayer");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const PendingMapChangeValetudoEvent = require("../../valetudo_events/events/PendingMapChangeValetudoEvent");
const Tools = require("../../Tools");
const ValetudoMap = require("../../entities/map/ValetudoMap");
const ValetudoRobot = require("../../core/ValetudoRobot");
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
     */
    constructor(options) {
        super(options);

        this.lastMapPoll = new Date(0);
        this.fanSpeeds = options.fanSpeeds;
        this.waterGrades = options.waterGrades ?? {};

        this.registerCapability(new capabilities.RoborockFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(this.fanSpeeds).map(k => {
                return new ValetudoSelectionPreset({name: k, value: this.fanSpeeds[k]});
            })
        }));

        [
            capabilities.RoborockBasicControlCapability,
            capabilities.RoborockConsumableMonitoringCapability,
            capabilities.RoborockZoneCleaningCapability,
            capabilities.RoborockGoToLocationCapability,
            capabilities.RoborockWifiConfigurationCapability,
            capabilities.RoborockLocateCapability,
            capabilities.RoborockDoNotDisturbCapability,
            capabilities.RoborockCarpetModeControlCapability,
            capabilities.RoborockSpeakerVolumeControlCapability,
            capabilities.RoborockSpeakerTestCapability,
            capabilities.RoborockVoicePackManagementCapability,
            capabilities.RoborockManualControlCapability,
            capabilities.RoborockTotalStatisticsCapability,
            capabilities.RoborockCurrentStatisticsCapability,
        ].forEach(capability => {
            this.registerCapability(new capability({robot: this}));
        });

        this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
            type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN,
            attached: true
        }));
    }

    setEmbeddedParameters() {
        this.deviceConfPath = RoborockValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = RoborockValetudoRobot.TOKEN_FILE_PATH;
    }


    onMessage(msg) {
        switch (msg.method) {
            case "props":
                this.parseAndUpdateState(msg.params);
                this.sendCloud({id: msg.id, result: "ok"});
                return true;
            case "event.status":
                if (msg.params &&
                    msg.params[0] &&
                    msg.params[0].state !== undefined
                ) {
                    this.parseAndUpdateState(msg.params[0]);

                    let StatusStateAttribute = this.state.getFirstMatchingAttribute({
                        attributeClass: stateAttrs.StatusStateAttribute.name
                    });

                    if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                        this.pollMap();
                    }
                }
                this.sendCloud({id: msg.id, result: "ok"});
                return true;
            case "_sync.getctrycode":
                this.sendCloud({
                    id: msg.id, result: {ctry_code: "DE"} //TODO
                });
                return true;
            case "_sync.getAppData":
                this.sendCloud({
                    id: msg.id,
                    error: {
                        code: -6,
                        message: "not set app data"
                    }
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
                            this.mapUploadUrlPrefix +
                            "/api/miio/map_upload_handler/" + filename + "_" + idx + "?" +
                            process.hrtime().toString().replace(/,/g, "")
                        );
                    });
                } else {
                    for (let i = 0; i < 4; i++) {
                        mapUploadUrls.push(
                            this.mapUploadUrlPrefix +
                            "/api/miio/map_upload_handler/" + filename + "_" + i + "?" +
                            process.hrtime().toString().replace(/,/g, "")
                        );
                    }
                }

                this.sendCloud({id: msg.id, result: mapUploadUrls});
                return true;
            }

            case "event.bin_full":
                this.valetudoEventStore.raise(new DustBinFullValetudoEvent({}));
                this.sendCloud({id: msg.id, result: "ok"});
                break;
            case "event.remind_to_save_map":
                this.valetudoEventStore.raise(new PendingMapChangeValetudoEvent({}));
                this.sendCloud({id: msg.id, result: "ok"});
                break;

            case "event.back_to_dock": //TODO
            case "event.error_code":
            case "event.relocate_failed_back":
            case "event.goto_target_succ":
            case "event.target_not_reachable":
            case "event.consume_material_notify":
            case "event.segment_map_done":
            case "event.clean_complete":
            case "event.segment_clean_succ":
            case "event.segment_clean_part_done":
            case "event.zoned_clean_succ":
            case "event.zoned_clean_partial_done":
            case "event.zoned_clean_failed":
            case "event.relocate_fail":
            case "event.low_power_back": //If the robot is currently cleaning and the battery drops below 20% it drives home to charge
                this.sendCloud({id: msg.id, result: "ok"});
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

        if (data["state"] !== undefined && STATUS_MAP[data["state"]]) {
            let statusValue = STATUS_MAP[data["state"]].value;
            let statusFlag = STATUS_MAP[data["state"]].flag;
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

                if (data["in_cleaning"] === 2) {
                    //Since this is some roborock-related weirdness, we're using the metaData to store this
                    statusMetaData.zoned = true;
                } else if (data["in_cleaning"] === 3) {
                    statusMetaData.segment_cleaning = true;
                }
            } else if (statusValue === stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                statusMetaData.error_code = data["error_code"];
                statusMetaData.error_description = GET_ERROR_CODE_DESCRIPTION(data["error_code"]);
            }

            newStateAttr = new stateAttrs.StatusStateAttribute({
                value: statusValue,
                flag: statusFlag,
                metaData: statusMetaData
            });

            this.state.upsertFirstMatchingAttribute(newStateAttr);
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
            this.capabilities[capabilities.RoborockPersistentMapControlCapability.TYPE].persistentMapState = data["lab_status"] === 1;
        }

        if (data["water_box_status"] !== undefined) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                type: stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
                attached: data["water_box_status"] === 1
            }));

            if (data["water_box_carriage_status"] !== undefined) {
                this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                    type: stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                    attached: data["water_box_carriage_status"] === 1
                }));
            } else {
                this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                    type: stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                    attached: data["water_box_status"] === 1
                }));
            }

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

        this.emitStateAttributesUpdated();
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

            this.sendCloud({"method": "get_map_v1"}).then(res => {
                if (res?.length === 1) {
                    let repollSeconds = this.mapPollingIntervals.default;

                    let StatusStateAttribute = this.state.getFirstMatchingAttribute({
                        attributeClass: stateAttrs.StatusStateAttribute.name
                    });

                    if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                        repollSeconds = this.mapPollingIntervals.active;
                    }

                    if (res && res[0] === "retry") {
                        /**
                         * This fixes the map not being available on boot for another 60 seconds which is annoying
                         */
                        if (this.state.map?.metaData?.defaultMap !== true) {
                            repollSeconds += 1;
                        } else {
                            repollSeconds = this.mapPollingIntervals.active;
                        }
                    }

                    setTimeout(() => {
                        return this.pollMap();
                    }, repollSeconds * 1000);
                }
            }, err => {
                // ¯\_(ツ)_/¯
            }).finally(() => {
                this.pollingMap = false;
            });
        }

        this.pollMapTimeout = setTimeout(() => {
            return this.pollMap();
        }, 5 * 60 * 1000); // 5 minutes
    }

    preprocessMap(data) {
        return new Promise((resolve, reject) => {
            zlib.gunzip(data, (err, result) => {
                return err ? reject(err) : resolve(result);
            });
        });
    }

    async parseMap(data) {
        const parsedMap = RRMapParser.PARSE(data);

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
                const {partitions, rootPartition} = Tools.PARSE_PROC_CMDLINE();

                if (partitions[rootPartition]) {
                    Logger.info(`Current rootfs: ${partitions[rootPartition]} (${rootPartition})`);
                }
            } catch (e) {
                Logger.warn("Unable to parse /proc/cmdline", e);
            }
        }
    }

    getManufacturer() {
        return "Roborock";
    }

    /**
     * @private
     * @returns {string | null}
     */
    getFirmwareVersion() {
        try {
            const os_release = fs.readFileSync("/etc/os-release").toString();
            const parsedFile = /^ROBOROCK_VERSION=(?<version>[\d._]*)$/m.exec(os_release);

            if (parsedFile !== null && parsedFile.groups && parsedFile.groups.version) {
                return parsedFile.groups.version.split("_")?.[1];
            } else {
                return null;
            }
        } catch (e) {
            Logger.warn("Unable to determine the Firmware Version", e);

            return null;
        }
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
                ourProps[ValetudoRobot.WELL_KNOWN_PROPERTIES.FIRMWARE_VERSION] = firmwareVersion;
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
    100: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    101: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR
    }
};

const ERROR_CODES = {
    0: "No error",
    1: "LDS jammed",
    2: "Stuck front bumper",
    3: "Wheel lost floor contact. Robot is on the verge of falling",
    4: "Cliff sensor dirty or robot on the verge of falling",
    5: "Main brush jammed",
    6: "Side brush jammed",
    7: "Wheel jammed",
    8: "Robot stuck or trapped",
    9: "Dustbin missing",
    10: "Filter jammed",
    11: "Magnetic interference",
    12: "Low battery",
    13: "Charging issues",
    14: "Battery temperature out of operating range",
    15: "Wall sensor dirty",
    16: "Tilted robot",
    17: "Side brush error. Reboot required",
    18: "Fan error. Reboot required",
    19: "Charging station without power",
    21: "LDS bumper jammed",
    22: "Charging contacts dirty",
    23: "Charging station dirty",
    24: "Stuck inside restricted area",
    25: "Camera dirty",
    26: "Wall sensor dirty",
    29: "Animal excrements detected"

    //TODO: there are also 100+ codes. No idea when they might appear though
};

const GET_ERROR_CODE_DESCRIPTION = (errorCodeId) => {
    if (ERROR_CODES[errorCodeId] !== undefined) {
        return ERROR_CODES[errorCodeId];
    } else {
        return "UNKNOWN ERROR CODE " + errorCodeId;
    }
};

module.exports = RoborockValetudoRobot;
