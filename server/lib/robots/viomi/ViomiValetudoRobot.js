const attributes = require("./ViomiCommonAttributes");
const capabilities = require("./capabilities");
const entities = require("../../entities");
const fs = require("fs");
const Logger = require("../../Logger");
const miioCapabilities = require("../common/miioCapabilities");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const ValetudoSelectionPreset = require("../../entities/core/ValetudoSelectionPreset");
const ViomiMapParser = require("./ViomiMapParser");
const zlib = require("zlib");

const stateAttrs = entities.state.attributes;
const mapActions = Object.freeze({
    JOIN_SEGMENT_TYPE: 0,
    SPLIT_SEGMENT_TYPE: 1,
});

class ViomiValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {object} [options.fanSpeeds]
     * @param {object} [options.waterGrades]
     */
    constructor(options) {
        super(options);
        this.debugConfig = options.config.get("debug");

        this.lastMapPoll = new Date(0);
        if (options.fanSpeeds !== undefined) {
            this.fanSpeeds = options.fanSpeeds;
        } else {
            this.fanSpeeds = attributes.FAN_SPEEDS;
        }
        if (options.waterGrades !== undefined) {
            this.waterGrades = options.waterGrades;
        } else {
            this.waterGrades = attributes.WATER_GRADES;
        }

        this.ephemeralState = {
            carpetModeEnabled: undefined,
            lastOperationType: null,
            lastOperationAdditionalParams: []
        };

        this.registerCapability(new capabilities.ViomiBasicControlCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(this.fanSpeeds).map(k => new ValetudoSelectionPreset({name: k, value: this.fanSpeeds[k]}))
        }));

        this.registerCapability(new capabilities.ViomiWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => new ValetudoSelectionPreset({name: k, value: this.waterGrades[k]}))
        }));

        this.registerCapability(new miioCapabilities.MiioWifiConfigurationCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiLocateCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiConsumableMonitoringCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiPersistentMapControlCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiCombinedVirtualRestrictionsCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiZoneCleaningCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiVoicePackManagementCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiCarpetModeControlCapability({
            robot: this,
            carpetConfigFile: "/mnt/UDISK/config/new_user_perference.txt"
        }));

        this.registerCapability(new capabilities.ViomiSpeakerTestCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiSpeakerVolumeControlCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiMapSegmentationCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiMapSegmentEditCapability({
            robot: this,
            mapActions: mapActions,
            lang: "en"
        }));

        this.registerCapability(new capabilities.ViomiMapResetCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiMapSegmentRenameCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiDoNotDisturbCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiManualControlCapability({
            robot: this
        }));

        this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
            type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN,
            attached: false
        }));

        this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
            type: stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
            attached: false
        }));

        this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
            type: stateAttrs.AttachmentStateAttribute.TYPE.MOP,
            attached: true
        }));

        if (this.debugConfig.enableDebugCapability) {
            this.registerCapability(new capabilities.ViomiDebugCapability({
                robot: this
            }));
        }
    }

    setEmbeddedParameters() {
        this.deviceConfPath = ViomiValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = ViomiValetudoRobot.TOKEN_FILE_PATH;
    }

    /**
     * Sends a {'method': method, 'params': args} message to the robot.
     * Uses the cloud socket if available or falls back to the local one.
     *
     * @public
     * @param {string} method
     * @param {object|Array} args
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    sendCommand(method, args = [], options = {}) {
        options = Object.assign({
            timeout: 2000,
        }, options);
        return super.sendCommand(method, args, options);
    }

    /**
     * Sends a json object to cloud socket.
     *
     * @public
     * @param {object} msg JSON object to send.
     * @param {object} options
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    sendCloud(msg, options = {}) {
        options = Object.assign({
            timeout: 2000,
        }, options);
        return super.sendCloud(msg, options);
    }

    onMessage(msg) {
        if (msg.method?.startsWith("prop.")) {
            this.parseAndUpdateState({
                [msg.method.substr(5)]: msg.params[0]
            });

            return true;
        }
        return super.onMessage(msg);
    }

    async pollState() {
        const response = await this.sendCommand("get_prop", STATE_PROPERTIES, {timeout: 3000});

        if (response) {
            let statusDict = {};
            STATE_PROPERTIES.forEach((key, index) => statusDict[key] = response[index]);
            this.parseAndUpdateState(statusDict);
        }

        return this.state;
    }

    //TODO: viomi repolls the map on status change to quick poll states. We probably should do the same
    parseAndUpdateState(data) {
        let newStateAttr;

        if (
            (data["run_state"] !== undefined && STATUS_MAP[data["run_state"]]) ||
            (data["err_state"] !== undefined && ERROR_MAP[data["err_state"]])
        ) {
            let status;
            let error;
            let statusValue;
            let statusMetaData = {};

            const previousState = this.state.getFirstMatchingAttributeByConstructor(stateAttrs.StatusStateAttribute);

            //TODO: does it make sense to always take the error state value if there is any?
            if (ERROR_MAP[data["err_state"]] && ERROR_MAP[data["err_state"]].value !== null) {
                error = ERROR_MAP[data["err_state"]];
            }
            if (data["mode"] === 5 || (data["mode"] === undefined && previousState && previousState.value === stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL)) {
                // Manual control enabled, run_state would set the status to "cleaning"
                statusValue = stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL;
            } else {
                if (STATUS_MAP[data["run_state"]]) {
                    status = STATUS_MAP[data["run_state"]];
                    statusValue = status.value;
                }
            }


            if (error !== undefined) {
                if (error.value === stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                    // If status is an error, mark it as such
                    statusMetaData.error_code = data["err_state"];
                    statusValue = stateAttrs.StatusStateAttribute.VALUE.ERROR;
                } else if (status === undefined) {
                    // If it is not an error but we don't have any status data, use the status code from the error
                    statusValue = error.value;
                }
                // Some errors are rather "warnings": keep the error description if we have one
                if (error.desc !== undefined) {
                    statusMetaData.error_description = error.desc;
                }
            }

            let statusFlag = stateAttrs.StatusStateAttribute.FLAG.NONE;
            if (this.ephemeralState.lastOperationType !== null &&
                (statusValue === stateAttrs.StatusStateAttribute.VALUE.CLEANING || statusValue === stateAttrs.StatusStateAttribute.VALUE.PAUSED)) {
                statusFlag = this.ephemeralState.lastOperationType;
            } else if (this.ephemeralState.lastOperationType !== null && statusValue === stateAttrs.StatusStateAttribute.VALUE.RETURNING) {
                // Operation completed without pausing, cleanup last operation so we don't try to resume next time
                // We only cleanup on "RETURNING" to avoid race conditions in case we set lastOperation and the vacuum
                // takes some time to update the status.
                this.ephemeralState.lastOperationType = null;
                this.ephemeralState.lastOperationAdditionalParams = [];
            }

            //TODO: trigger re-poll of map if new status is fast polling state
            newStateAttr = new stateAttrs.StatusStateAttribute({
                value: statusValue,
                flag: statusFlag,
                metaData: statusMetaData
            });

            this.state.upsertFirstMatchingAttribute(newStateAttr);
        }

        if (data["battary_life"] !== undefined) {
            let previousBatteryAttr = this.state.getFirstMatchingAttributeByConstructor(stateAttrs.BatteryStateAttribute);
            let flag = stateAttrs.BatteryStateAttribute.FLAG.NONE;
            let level = data["battary_life"] ?? 0;

            // TODO: find out what "is_charge" means
            // For now it seems like it's 0 when it's charging and 1 when it is not
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

        if (data["suction_grade"] !== undefined) {
            let matchingFanSpeed = Object.keys(this.fanSpeeds).find(key => this.fanSpeeds[key] === data["suction_grade"]);

            this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                type: stateAttrs.PresetSelectionStateAttribute.TYPE.FAN_SPEED,
                value: matchingFanSpeed,
                customValue: matchingFanSpeed === stateAttrs.PresetSelectionStateAttribute.INTENSITY.CUSTOM ? data["suction_grade"] : undefined
            }));
        }

        if (data["water_grade"] !== undefined) {
            let matchingWaterGrade = Object.keys(this.waterGrades).find(key => this.waterGrades[key] === data["water_grade"]);

            this.state.upsertFirstMatchingAttribute(new stateAttrs.PresetSelectionStateAttribute({
                type: stateAttrs.PresetSelectionStateAttribute.TYPE.WATER_GRADE,
                value: matchingWaterGrade,
                customValue: matchingWaterGrade === stateAttrs.PresetSelectionStateAttribute.INTENSITY.CUSTOM ? data["water_grade"] : undefined
            }));
        }

        if (data["s_area"]) { //TODO: actually not an attribute. Use Job
            this.state.upsertFirstMatchingAttribute(new stateAttrs.LatestCleanupStatisticsAttribute({
                type: stateAttrs.LatestCleanupStatisticsAttribute.TYPE.AREA,
                value: data["s_area"] * 10000 //m² to cm²
            }));
        }

        if (data["s_time"]) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.LatestCleanupStatisticsAttribute({
                type: stateAttrs.LatestCleanupStatisticsAttribute.TYPE.DURATION,
                value: data["s_time"] * 60
            }));
        }

        if (data["box_type"] !== undefined) {
            switch (data["box_type"]) {
                case attributes.ViomiBoxType.NONE:
                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN,
                        attached: false
                    }));

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
                        attached: false
                    }));

                    break;
                case attributes.ViomiBoxType.VACUUM:
                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN,
                        attached: true
                    }));

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
                        attached: false
                    }));
                    break;
                case attributes.ViomiBoxType.WATER:
                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN,
                        attached: false
                    }));

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
                        attached: true
                    }));
                    break;
                case attributes.ViomiBoxType.VACUUM_AND_WATER:
                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN,
                        attached: true
                    }));

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERTANK,
                        attached: true
                    }));
                    break;
            }
        }

        // Viomi naming is abysmal
        if (data["is_mop"] !== undefined) {
            let operationModeValue;

            switch (data["is_mop"]) {
                case attributes.ViomiOperationMode.VACUUM:
                    operationModeValue = stateAttrs.OperationModeStateAttribute.VALUE.VACUUM;
                    break;
                case attributes.ViomiOperationMode.MIXED:
                    operationModeValue = stateAttrs.OperationModeStateAttribute.VALUE.VACUUM_AND_MOP;
                    break;
                case attributes.ViomiOperationMode.MOP:
                    operationModeValue = stateAttrs.OperationModeStateAttribute.VALUE.MOP;
                    break;
            }

            if (operationModeValue) {
                this.state.upsertFirstMatchingAttribute(new stateAttrs.OperationModeStateAttribute({
                    value: operationModeValue
                }));
            }
        }

        if (data["mop_type"] !== undefined) {
            if (data["mop_type"]) {
                this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                    type: stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                    attached: true
                }));
            } else {
                this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                    type: stateAttrs.AttachmentStateAttribute.TYPE.MOP,
                    attached: false
                }));
            }
        }

        if (data["remember_map"] !== undefined) {
            let persistentMapSetting = stateAttrs.PersistentMapSettingStateAttribute.VALUE.DISABLED;
            if (data["remember_map"] === 1) {
                persistentMapSetting = stateAttrs.PersistentMapSettingStateAttribute.VALUE.ENABLED;
            }
            this.state.upsertFirstMatchingAttribute(new stateAttrs.PersistentMapSettingStateAttribute({
                value: persistentMapSetting
            }));
        }

        // Adjust timezone if != UTC
        if (data["timezone"] !== undefined && data["timezone"] !== 0) {
            this.sendCommand("set_timezone", [0], {timeout: 12000}).then(_ => {
                Logger.info("Viomi timezone adjusted to UTC");
            });
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

            this.sendCommand("set_uploadmap", [2], {timeout: 2000}).then(() => {
                let repollSeconds = 60;

                let StatusStateAttribute = this.state.getFirstMatchingAttribute({
                    attributeClass: stateAttrs.StatusStateAttribute.name
                });

                if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                    repollSeconds = 2;
                }

                setTimeout(() => this.pollMap(), repollSeconds * 1000);
            }, err => {
                // ¯\_(ツ)_/¯
            }).finally(() => {
                this.pollingMap = false;
            });
        }

        this.pollMapTimeout = setTimeout(() => this.pollMap(), 5 * 60 * 1000); // 5 minutes
    }


    preprocessMap(data) {
        return new Promise((resolve, reject) => {
            zlib.inflate(data, (err, result) => err ? reject(err) : resolve(result));
        });
    }

    async parseMap(data) {
        try {
            // noinspection UnnecessaryLocalVariableJS
            const map = new ViomiMapParser(data).parse();

            this.state.map = map;

            if (this.debugConfig.enableDebugCapability) {
                this.lastRawMap = data;
            }

            this.emitMapUpdated();
            return this.state.map; //TODO
        } catch (e) {
            // save map data for later debugging
            if (this.debugConfig.enableDebugCapability) {
                // @ts-ignore
                this.lastFailedRawMap = data;
                this.lastMapError = e.toString();
            }

            let i = 0;
            let filename = "";
            do {
                filename = "/tmp/mapdata" + i++;
            } while (fs.existsSync(filename));

            fs.writeFile(filename, zlib.deflateSync(data), (err) => {
                Logger.warn("Error while saving unparsable map", err);
            });
            Logger.error("Error parsing map. Dump saved in", filename);

            throw e;
        }
    }

    getManufacturer() {
        return "Viomi Technology Co., Ltd";
    }
}

ViomiValetudoRobot.DEVICE_CONF_PATH = "/etc/miio/device.conf";
ViomiValetudoRobot.TOKEN_FILE_PATH = "/etc/miio/device.token";

/** Device specific status code mapping. */
const STATE_PROPERTIES = [
    "run_state",
    "mode",
    "err_state",
    "battary_life",
    "box_type",
    "mop_type",
    "s_time",
    "s_area",
    "suction_grade",
    "water_grade",
    "remember_map",
    "has_map",
    "is_mop",
    "has_newmap",
    "timezone"
];

const STATUS_MAP = Object.freeze({
    0: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    1: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    2: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED
    },
    3: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING  // Vacuuming
    },
    4: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING  // Vacuuming and mopping
    },
    7: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING  // Mopping
    }
});

//not every viomi error property value is actually an error.
const ERROR_MAP = Object.freeze({
    500: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Lidar sensor timeout - ensure laser is not blocked"
    },

    501: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Wheels suspended - place the vacuum on a flat surface"
    },

    502: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Low battery"
    },

    503: { // invalid mop mode (e.g. mop without mop installed)
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Dust bin or 2-in-1 dust bin is not installed"
    },

    // robot cannot find its location, but its required for the specified mode (e.g. spot clean)
    507: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Unable to find current robot location"
    },

    508: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Uneven ground - place the vacuum on a flat surface or perform sensor calibration"
    },

    509: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Cliff sensor error - wipe sensors clean with a cloth"
    },

    510: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Collision sensor error - remove foreign objects from sensors" //RETURN_HOME
    },

    511: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Could not return to dock"
    },

    512: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Could not return to dock"
    },

    513: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Could not navigate to location - remove any obstacles"
    },

    514: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Vacuum is stuck - remove any obstacles"
    },

    515: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Charging error - clean the charging contacts on the back"
    },

    516: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Vacuum temperature error - wait for the vacuum to cool down"
    },

    521: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Water tank is not installed"
    },

    522: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Mop is not installed"
    },

    525: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Insufficient water in tank"
    },

    527: {
        value: null,  // Not an error, nor a state
        desc: "Remove mop and water tank"
    },

    528: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Dust bin or 2-in-1 dust bin is not installed"
    },

    529: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Mop and water tank are not installed"
    },

    530: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Mop and 2-in-1 dust-bin + water tank are not installed"
    },

    531: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "2-in-1 dust bin + water tank not installed"
    },

    537: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Not cleaning because of do-not-disturb settings"
    },

    2101: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING,
        desc: "Insufficient battery, continuing cleaning after recharge"
    },

    2102: { // point cleaning finished, returning home
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING,
        desc: "Cleaning finished, returning to dock"
    },

    2103: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED,
        desc: "Charging"
    },

    2104: { // aborted, returning home
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING,
        desc: "Cleaning aborted, returning to dock"
    },

    2105: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED,
        desc: "Fully charged"
    }
});

module.exports = ViomiValetudoRobot;
