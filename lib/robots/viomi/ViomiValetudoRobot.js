const zlib = require("zlib");
const fs = require("fs");
const MiioValetudoRobot = require("../MiioValetudoRobot");
const entities = require("../../entities");
const ViomiMapParser = require("../../ViomiMapParser");
const Logger = require("../../Logger");

const stateAttrs = entities.state.attributes;

class ViomiValetudoRobot extends MiioValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../../Configuration")} options.config
     * @param {object} options.fanSpeeds
     */
    constructor(options) {
        super(options);

        this.lastMapPoll = new Date(0);
        if (options.fanSpeeds !== undefined) {
            this.fanSpeeds = options.fanSpeeds;
        } else {
            this.fanSpeeds = GENERIC_FAN_SPEEDS;
        }

        // TODO: add capabilities
    }

    setEmbeddedPaths() {
        this.deviceConfPath = ViomiValetudoRobot.DEVICE_CONF_PATH;
        this.tokenFilePath = ViomiValetudoRobot.TOKEN_FILE_PATH;
    }

    onMessage(msg) {
        Logger.trace("New cloud message:", msg);

        switch (msg.method) {
            case "_sync.gen_tmp_presigned_url":
            case "_sync.gen_presigned_url": {
                let key = "urls"; // default key
                if (msg.params && msg.params.suffix) {
                    key = msg.params.suffix;
                }

                let result = {};
                result[key] = [];

                for (let i = 0; i < 4; i++) {
                    let url = this.mapUploadHost +
                        "/api/miio/map_upload_handler?ts=" + process.hrtime() + "&suffix=" + key;
                    result[key].push({"url": url, "method": "PUT"});
                }
                this.sendCloud({id: msg.id, "result": result});
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
            let statusValue;
            let statusMetaData = {};

            //TODO: does it make sense to always take the error state value if there is any?
            if (ERROR_MAP[data["err_state"]]) {
                status = ERROR_MAP[data["err_state"]];
            } else {
                status = STATUS_MAP[data["run_state"]];
            }

            statusValue = status.value;

            if (statusValue === stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                statusMetaData.error_code = data["err_state"];
                statusMetaData.error_description = status.desc;
            }

            // TODO: stub - set meaningful value
            const statusFlag = stateAttrs.StatusStateAttribute.FLAG.RESUMABLE;

            //TODO: trigger re-poll of map if new status is fast polling state
            newStateAttr = new stateAttrs.StatusStateAttribute({
                value: statusValue,
                flag: statusFlag,
                metaData: statusMetaData
            });

            this.state.upsertFirstMatchingAttribute(newStateAttr);
        }

        if (data["battary_life"] !== undefined) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                level: data["battary_life"] || 0
            }));
        }

        if (data["suction_grade"] !== undefined) {
            let matchingFanSpeed = Object.keys(this.fanSpeeds).find(key => this.fanSpeeds[key] === data["suction_grade"]);
            this.state.upsertFirstMatchingAttribute(new stateAttrs.FanSpeedStateAttribute({
                value: matchingFanSpeed
            }));
        }

        if (data["s_area"]) { //TODO: actually not an attribute. Use Job
            this.state.upsertFirstMatchingAttribute(new stateAttrs.LatestCleanupStatisticsAttribute({
                type: stateAttrs.LatestCleanupStatisticsAttribute.TYPE.AREA,
                value: data["s_area"] * 1000 //m² to cm²
            }));
        }

        if (data["s_time"]) {
            this.state.upsertFirstMatchingAttribute(new stateAttrs.LatestCleanupStatisticsAttribute({
                type: stateAttrs.LatestCleanupStatisticsAttribute.TYPE.DURATION,
                value: data["s_time"]
            }));
        }

        // TODO: implement dust box type
        if (data["box_type"] !== undefined) {
            switch (data["box_type"]) {
                case BoxType.NONE:
                    this.state.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    });
                    this.state.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    });

                    break;
                case BoxType.VACUUM:
                    this.state.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    });

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    }));
                    break;
                case BoxType.WATER:
                    this.state.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    });

                    this.state.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    }));
                    break;
                case BoxType.VACUUM_AND_WATER:
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
                case ViomiOperationMode.VACUUM:
                    operationModeValue = stateAttrs.OperationModeStateAttribute.VALUE.VACUUM;
                    break;
                case ViomiOperationMode.MIXED:
                    operationModeValue = stateAttrs.OperationModeStateAttribute.VALUE.VACUUM_AND_MOP;
                    break;
                case ViomiOperationMode.MOP:
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

// Device specific enums
/** @enum {number} */
const ViomiOperationMode = Object.freeze({
    VACUUM: 0,
    MOP: 2,
    MIXED: 1,
});

/** @enum {number} */
const BoxType = Object.freeze({
    NONE: 0,
    VACUUM: 1,
    WATER: 2,
    VACUUM_AND_WATER: 3
});

const GENERIC_FAN_SPEEDS = Object.freeze({
    [stateAttrs.FanSpeedStateAttribute.VALUE.LOW]: 0,
    [stateAttrs.FanSpeedStateAttribute.VALUE.MEDIUM]: 1,
    [stateAttrs.FanSpeedStateAttribute.VALUE.HIGH]: 2,
    [stateAttrs.FanSpeedStateAttribute.VALUE.MAX]: 3
});

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
    }
});

//not every viomi error property value is actually an error.
const ERROR_MAP = Object.freeze({
    503: { // invalid mop mode (e.g. mop without mop installed)
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "INVALID_MOP_MODE"
    },

    // robot cannot find its location, but its required for the specified mode (e.g. spot clean)
    507: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "CANNOT_FIND_LOCATION" //SPOT_CLEAN
    },
    510: {
        value: stateAttrs.StatusStateAttribute.VALUE.ERROR,
        desc: "CANNOT_FIND_LOCATION" //RETURN_HOME
    },

    2102: { // point cleaning finished, returning home
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    2103: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    },
    2104: { // aborted, returning home
        value: stateAttrs.StatusStateAttribute.VALUE.RETURNING
    },
    2105: {
        value: stateAttrs.StatusStateAttribute.VALUE.DOCKED
    }
});

module.exports = ViomiValetudoRobot;