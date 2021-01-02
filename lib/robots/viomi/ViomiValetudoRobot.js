const zlib = require("zlib");
const fs = require("fs");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const entities = require("../../entities");
const ViomiMapParser = require("../../ViomiMapParser");
const Logger = require("../../Logger");
const capabilities = require("./capabilities");
const attributes = require("./ViomiCommonAttributes");
const IntensityPreset = require("../../entities/core/ValetudoIntensityPreset");
const ValetudoWaterUsagePreset = require("../../entities/core/ValetudoWaterUsagePreset");

const stateAttrs = entities.state.attributes;

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

        this.registerCapability(new capabilities.ViomiBasicControlCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiFanSpeedControlCapability({
            robot: this,
            presets: Object.keys(this.fanSpeeds).map(k => new IntensityPreset({name: k, value: this.fanSpeeds[k]}))
        }));

        this.registerCapability(new capabilities.ViomiWaterUsageControlCapability({
            robot: this,
            presets: Object.keys(this.waterGrades).map(k => new ValetudoWaterUsagePreset({
                name: k,
                value: this.fanSpeeds[k]
            }))
        }));

        this.registerCapability(new capabilities.ViomiWifiConfigurationCapability({
            robot: this
        }));

        this.registerCapability(new capabilities.ViomiRawCommandCapability({
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
    }

    setEmbeddedParameters() {
        this.deviceConfPath = ViomiValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = ViomiValetudoRobot.TOKEN_FILE_PATH;
        this.embeddedDummycloudIp = "127.0.0.1"; //required for the iptables redirect to work
    }

    onMessage(msg) {
        switch (msg.method) {
            case "_sync.gen_tmp_presigned_url":
            case "_sync.gen_presigned_url": {
                let key = "urls"; // default key

                if (msg.params && msg.params.suffix) {
                    key = msg.params.suffix;
                }

                let mapUploadUrls = [];
                for (let i = 0; i < 4; i++) {
                    let url = this.mapUploadUrlPrefix +
                        "/api/miio/map_upload_handler?" +
                        process.hrtime().toString().replace(/,/g, "") +
                        "&suffix=" + key;
                    mapUploadUrls.push({"url": url, "method": "PUT"});
                }
                let result = {};
                result[key] = mapUploadUrls;
                this.sendCloud({id: msg.id, result: result});

                return true;
            }
        }

        if (msg.method.startsWith("prop.")) {
            this.parseAndUpdateState({
                [msg.method.substr(5)]: msg.params[0]
            });

            return true;
        }
        return false;
    }

    async pollState() {
        const response = await this.sendCommand("get_prop", STATE_PROPERTIES);

        if (response) {
            this.parseAndUpdateState(response[0]);
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

            //TODO: does it make sense to always take the error state value if there is any?
            if (ERROR_MAP[data["err_state"]] && ERROR_MAP[data["err_state"]].value !== null) {
                error = ERROR_MAP[data["err_state"]];
            }
            if (STATUS_MAP[data["run_state"]]) {
                status = STATUS_MAP[data["run_state"]];
                statusValue = status.value;
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

            // TODO: stub - set meaningful value
            const statusFlag = stateAttrs.StatusStateAttribute.FLAG.NONE;

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
            let level = data["battary_life"] || 0;

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

            this.state.upsertFirstMatchingAttribute(new stateAttrs.IntensityStateAttribute({
                type: stateAttrs.IntensityStateAttribute.TYPE.FAN_SPEED,
                value: matchingFanSpeed,
                customValue: matchingFanSpeed === stateAttrs.IntensityStateAttribute.VALUE.CUSTOM ? data["suction_grade"] : undefined
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
                value: data["s_time"]
            }));
        }

        if (data["box_type"] !== undefined) {
            switch (data["box_type"]) {
                case attributes.ViomiBoxType.NONE:
                    this.state.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    });
                    this.state.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    });

                    break;
                case attributes.ViomiBoxType.VACUUM:
                    this.state.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    });

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    }));
                    break;
                case attributes.ViomiBoxType.WATER:
                    this.state.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    });

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    }));
                    break;
                case attributes.ViomiBoxType.VACUUM_AND_WATER:
                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    }));

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
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
                    type: stateAttrs.AttachmentStateAttribute.TYPE.MOP
                }));
            } else {
                this.state.removeMatchingAttributes({
                    attributeClass: stateAttrs.AttachmentStateAttribute.name,
                    attributeType: stateAttrs.AttachmentStateAttribute.TYPE.MOP
                });
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

    parseMap(data) {
        try {
            // noinspection UnnecessaryLocalVariableJS
            const map = new ViomiMapParser(data).parse();
            // TODO: reimplement zones
            // const zones = this.configuration.getZones();
            // zones.forEach((v, k) => v.user || zones.delete(k));
            // // TODO: Remove this once Valetudo supports named rooms in the zone clean menu.
            // map.layers.forEach(layer => {
            //     if (layer.type !== MapLayer.TYPE.SEGMENT) {
            //         return;
            //     }
            //     const id = layer.metaData.segmentId;
            //     zones.set(id, {id: id, name: layer.metaData.name, user: false});
            // });
            // this.configuration.setZones(zones);
            this.state.map = map;

            this.emitMapUpdated();
            return this.state.map; //TODO
        } catch (e) {
            // save map data for later debugging
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
];

const STATUS_MAP = Object.freeze({
    0: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    1: {
        value: stateAttrs.StatusStateAttribute.VALUE.PAUSED
    },
    2: {
        value: stateAttrs.StatusStateAttribute.VALUE.IDLE
    },
    3: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING
    },
    4: {
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    5: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    6: {
        value: stateAttrs.StatusStateAttribute.VALUE.CLEANING  // Vacuuming and mopping
    }
});

//not every viomi error property value is actually an error.
const ERROR_MAP = Object.freeze({
    500: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Lidar sensor timeout"
    },

    501: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Wheels stuck"
    },

    502: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Low battery"
    },

    503: { // invalid mop mode (e.g. mop without mop installed)
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Dust bin is not installed"
    },

    // robot cannot find its location, but its required for the specified mode (e.g. spot clean)
    507: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Unable to find current robot location"
    },

    508: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Uneven ground"
    },

    509: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Cliff sensor error"
    },

    510: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Collision sensor error" //RETURN_HOME
    },

    511: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Could not return to dock" // TODO: see why error is duplicated
    },

    512: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Could not return to dock" // TODO: see why error is duplicated
    },

    513: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Could not navigate to location"
    },

    514: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Vacuum is stuck"
    },

    515: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Charging error"
    },

    516: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Mop temperature error"
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
        desc: "Dust bin is not installed"
    },

    529: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Mop and water tank are not installed"
    },

    530: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Mop and water tank are not installed"
    },

    531: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "Water tank not installed"
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
