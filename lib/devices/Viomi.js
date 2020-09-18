const Logger = require("../Logger");
const MiioVacuum = require("./MiioVacuum");
const ViomiMapParser = require("../ViomiMapParser");
const fs = require("fs");
const zlib = require("zlib");
const spawnSync = require("child_process").spawnSync;

const entities = require("../entities");

const stateAttrs = entities.state.attributes;

/** @enum {number} */
const ViomiOperationMode = Object.freeze({
    VACUUM: 0,
    MOP: 2,
    MIXED: 1,
});

/** @enum {number} */
const ViomiOperation = Object.freeze({
    STOP: 0,
    START: 1,
    PAUSE: 2
});

/** @enum {number} */
const BoxType = Object.freeze({
    NONE: 0,
    VACUUM: 1,
    WATER: 2,
    VACUUM_AND_WATER: 3
});

/** @enum {number} */
const ViomiMovementMode = Object.freeze({
    NORMAL_CLEANING: 0,
    MOP_MOVES: 1,  // back and forth mopping movement (unsure if this has an effect without mop-mode)
    OUTLINE: 2,  // Only clean the rooms outline.
    ZONED_CLEAN_OR_MOPPING: 3,
});

/** Maps MiioVacuum.FAN_SPEEDS to Viomi suction grades. */
const FAN_GRADES = Object.freeze({
    "low": 0,
    "medium": 1,
    "high": 2,
    "max": 3
});

const FAN_SPEEDS = Object.freeze({
    [stateAttrs.FanSpeedStateAttribute.VALUE.LOW] : 0,
    [stateAttrs.FanSpeedStateAttribute.VALUE.MEDIUM] : 1,
    [stateAttrs.FanSpeedStateAttribute.VALUE.HIGH] : 2,
    [stateAttrs.FanSpeedStateAttribute.VALUE.MAX] : 3
});

/**
 * Converts an area rect spec to a viomi zone.
 *
 * @param {Array<import('../Configuration').Area>} areas
 * @param {boolean} restricted Whether this is the spec for restricted areas
 * @returns {string[]}
 */
function toZoneSpec(areas, restricted) {
    const mode = restricted ? 2 : 0;
    return areas.map((area, index) => {
        const a = ViomiMapParser.positionToViomi(area[0], area[1]);
        const b = ViomiMapParser.positionToViomi(area[2], area[3]);
        // Compute all the 4 corner points of the rectangle.
        const coords = [a.x, a.y, a.x, b.y, b.x, b.y, b.x, a.y];
        return `${index}_${mode}_` + coords.map(v => "" + v).join("_");
    });
}

/**
 * Implements the viomi.vacuum.v7 and .v8 device.
 * Still partially incomplete, contributions are welcome.
 */
class Viomi extends MiioVacuum {
    constructor(options) {
        super(options);

        this.fanSpeeds = FAN_SPEEDS;

        /** Current movement mode, select based on installed mop type. */
        this.robotState.upsertFirstMatchingAttribute(new stateAttrs.MovementModeStateAttribute({
            value: stateAttrs.MovementModeStateAttribute.VALUE.REGULAR
        }));

        /** @type {BoxType} */
        this.box_type = BoxType.VACUUM;

        // Default the language to EN
        this.sendCommand("set_language", [2]);

    }

    onMessage(msg) {
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
            this.updateStatus({
                [msg.method.substr(5)] : msg.params[0]
            });

            return true;
        }
        return false;
    }

    //TODO: maybe have some kind of additional properties attribute to store everything unknown?

    /** @override */
    parseStatus(newState) {
        if (
            (newState["run_state"] !== undefined && STATUS_PROP_MAP[newState["run_state"]]) ||
            (newState["err_state"] !== undefined && ERROR_PROP_MAP[newState["err_state"]])
        ) {
            let status;
            let statusValue;
            let statusMetaData = {};

            //TODO: does it make sense to always take the error state value if there is any?
            if (ERROR_PROP_MAP[newState["err_state"]]) {
                status = ERROR_PROP_MAP[newState["err_state"]];
            } else {
                status = STATUS_PROP_MAP[newState["run_state"]];
            }

            statusValue = status.value;

            if (statusValue === stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                statusMetaData.error_code = newState["err_state"];
                statusMetaData.error_description = status.desc;
            }

            //TODO: trigger re-poll of map if new status is fast polling state
            this.robotState.upsertFirstMatchingAttribute(new stateAttrs.StatusStateAttribute({
                value: statusValue,
                metaData: statusMetaData
            }));
        }

        if (newState["battary_life"] !== undefined) {
            this.robotState.upsertFirstMatchingAttribute(new stateAttrs.BatteryStateAttribute({
                level: newState["battary_life"] || 0
            }));
        }

        if (newState["suction_grade"] !== undefined) {
            let matchingFanSpeed = Object.keys(this.fanSpeeds).find(key => this.fanSpeeds[key] === newState["suction_grade"]);

            this.robotState.upsertFirstMatchingAttribute(new stateAttrs.FanSpeedStateAttribute({
                value: matchingFanSpeed
            }));
        }

        if (newState["s_area"]) { //TODO: actually not an attribute. Use Job
            this.robotState.upsertFirstMatchingAttribute(new stateAttrs.LatestCleanupStatisticsAttribute({
                type: stateAttrs.LatestCleanupStatisticsAttribute.TYPE.AREA,
                value: newState["s_area"] * 1000 //m² to cm²
            }));
        }

        if (newState["s_time"]) {
            this.robotState.upsertFirstMatchingAttribute(new stateAttrs.LatestCleanupStatisticsAttribute({
                type: stateAttrs.LatestCleanupStatisticsAttribute.TYPE.DURATION,
                value: newState["s_time"]
            }));
        }


        if (newState["box_type"] !== undefined) {
            switch (newState["box_type"]) {
                case BoxType.NONE:
                    this.robotState.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    });
                    this.robotState.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    });

                    break;
                case BoxType.VACUUM:
                    this.robotState.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    });

                    this.robotState.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    }));
                    break;
                case BoxType.WATER:
                    this.robotState.removeMatchingAttributes({
                        attributeClass: stateAttrs.AttachmentStateAttribute.name,
                        attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    });

                    this.robotState.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    }));
                    break;
                case BoxType.VACUUM_AND_WATER:
                    this.robotState.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
                    }));

                    this.robotState.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                        type: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
                    }));
                    break;
            }
        }

        //Viomi naming is abysmal
        if (newState["is_mop"] !== undefined) {
            let operationModeValue;

            switch (newState["is_mop"]) {
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
                this.robotState.upsertFirstMatchingAttribute(new stateAttrs.OperationModeStateAttribute({
                    value: operationModeValue
                }));
            }
        }

        if (newState["mop_type"] !== undefined) {
            if (newState["mop_type"]) {
                this.robotState.upsertFirstMatchingAttribute(new stateAttrs.AttachmentStateAttribute({
                    type: stateAttrs.AttachmentStateAttribute.TYPE.MOP
                }));
            } else {
                this.robotState.removeMatchingAttributes({
                    attributeClass: stateAttrs.AttachmentStateAttribute.name,
                    attributeType: stateAttrs.AttachmentStateAttribute.TYPE.MOP
                });
            }
        }

        //newState.is_charge
    }

    /** @override */
    onStatusChange() {
        this.checkMopMode();

        const statusAttribute = this.robotState.getFirstMatchingAttribute({
            attributeClass: stateAttrs.StatusStateAttribute.name
        });

        if (statusAttribute) {
            if (
                statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED ||
                statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.RETURNING
            ) {
                // The pending operation completed. Reset, so that subsequence startCleaning
                // calls can properly start a full clean.
                this.operation = [ViomiMovementMode.NORMAL_CLEANING, ViomiOperation.START, 0];
            }
        }
    }

    /**
     * Enables mopping. Selects the correct mode based on the water tank type.
     *
     * @param {boolean} enable Whether to enable or disable mopping.
     */
    enableMopMode(enable) {
        const dustbinAttribute = this.robotState.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
        });
        const waterboxAttribute = this.robotState.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
        });

        let operationMode = ViomiOperationMode.VACUUM;
        let movementMode = stateAttrs.MovementModeStateAttribute.VALUE.REGULAR;
        let movementModeMetaData = {};

        if (enable) {
            operationMode = dustbinAttribute && waterboxAttribute ? ViomiOperationMode.MIXED : ViomiOperationMode.MOP;

            if (waterboxAttribute && !dustbinAttribute) {
                // doesn't support mop_moves with water-only tank
                movementModeMetaData = {
                    viomiMode: ViomiMovementMode.ZONED_CLEAN_OR_MOPPING
                };
            } else if (waterboxAttribute) {
                movementMode = stateAttrs.MovementModeStateAttribute.VALUE.MOP;
            }

            this.robotState.upsertFirstMatchingAttribute(new stateAttrs.MovementModeStateAttribute({
                value: movementMode,
                metaData: movementModeMetaData
            }));

        }
        return this.sendCommand("set_mop", [operationMode]);
    }

    /** Checks that the mop mode setting is compatible with the current box_type and mop_type. */
    checkMopMode() {
        const currentOperationMode = this.robotState.getFirstMatchingAttributeByConstructor(stateAttrs.OperationModeStateAttribute);
        const currentMovementMode = this.robotState.getFirstMatchingAttributeByConstructor(stateAttrs.MovementModeStateAttribute);

        const dustbinAttribute = this.robotState.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.DUSTBIN
        });
        const waterboxAttribute = this.robotState.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.WATERBOX
        });
        const mopAttachmentAttribute = this.robotState.getFirstMatchingAttribute({
            attributeClass: stateAttrs.AttachmentStateAttribute.name,
            attributeType: stateAttrs.AttachmentStateAttribute.TYPE.MOP
        });



        if (!currentOperationMode || !currentMovementMode) {
            //Without data we cannot determine the correct state
            return;
        }


        let mopping_enabled = currentOperationMode.value !== stateAttrs.OperationModeStateAttribute.VALUE.VACUUM;
        mopping_enabled = mopping_enabled || currentMovementMode.value === stateAttrs.MovementModeStateAttribute.VALUE.MOP;
        mopping_enabled = mopping_enabled || currentOperationMode.metaData.viomiMode === ViomiMovementMode.ZONED_CLEAN_OR_MOPPING;



        let vacuum_enabled = currentOperationMode.value !== stateAttrs.OperationModeStateAttribute.VALUE.MOP;

        /*
        Logger.debug("checkMopMode: ", {
            mopping_enabled: mopping_enabled,
            vacuum_enabled: vacuum_enabled,
            currentOperationMode: currentOperationMode,
            currentMovementMode: currentMovementMode
        }); */

        if (dustbinAttribute && !waterboxAttribute && mopping_enabled) {
            Logger.info("Vacuum box doesn't support mopping. Mopping disabled.");

            this.enableMopMode(false);

            mopping_enabled = false;
            vacuum_enabled = true;

        } else if (waterboxAttribute && !dustbinAttribute && vacuum_enabled) {
            Logger.info("Walter-only tank doesn't support vacuuming. Setting to mop-only.");

            // (enableMopMode sets mop-only automatically based on the installed box).
            this.enableMopMode(true);
            mopping_enabled = true;
            vacuum_enabled = false;
        }

        if (!mopAttachmentAttribute && mopping_enabled) {
            Logger.info("Mopping requires a mop. Mopping disabled.");

            this.enableMopMode(false);
            mopping_enabled = false;

        } else if (
            mopAttachmentAttribute && !mopping_enabled && waterboxAttribute
        ) {
            Logger.info("Mop & water-tank installed, but mopping not enabled. Enabling mop-mode.");

            // If mop is installed and a water tank is present, assume user intent to be to mop.
            this.enableMopMode(true);
            mopping_enabled = true;
        }
    }

    async pollStatus() {
        return this.getCurrentStatus();
    }

    async getCurrentStatus() {
        let res = await this.sendCommand("get_prop", STATE_PROPERTIES);
        let statusDict = {};
        STATE_PROPERTIES.forEach((key, index) => statusDict[key] = res[index]);
        this.updateStatus(statusDict);

        return this.robotState;
    }

    pollMap() {
        clearTimeout(this.pollMapTask);
        this.sendCommand("set_uploadmap", [2], {timeout: 2000}).finally(() => {
            let repollSeconds = 300;

            let StatusStateAttribute = this.robotState.getFirstMatchingAttribute({
                attributeClass: stateAttrs.StatusStateAttribute.name
            });

            if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                repollSeconds = 5;
            }


            this.pollMapTask = setTimeout(() => this.pollMap(), repollSeconds * 1000);
        });
    }

    preprocessMap(data) {
        return new Promise((resolve, reject) => {
            zlib.inflate(data, (err, result) => err ? reject(err) : resolve(result));
        });
    }

    parseMap(data) {
        try {
            const map = new ViomiMapParser(data).parse();
            const zones = this.configuration.getZones();
            zones.forEach((v, k) => v.user || zones.delete(k));
            /*
            Object.entries(map.zones).map(v => {
                const id = parseInt(v[0]);
                zones.set(id, {id: id, name: v[1].name, user: false});
            }); */
            this.configuration.setZones(zones);
            /**
             * TODO:
             * The whole viomi concept needs to be reworked and reverted. Having them as Zones is wrong.
             * They are actually just segments which are mapLayers and can be cleaned by id
             */

            this.robotState.map = map;

            return this.robotState.map; //TODO
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

    /*
     * Coordinates are in mm and need to be in raw and unflipped format.
     * Viomi might not support the goto command. We interpret this as a point clean
     * (goTo(x,y); spotClean();)
     */
    async goTo(x_coord, y_coord) {
        x_coord = x_coord / 1000 - 20;
        y_coord = ViomiMapParser.MAX_MAP_HEIGHT - 1 - y_coord;
        y_coord = y_coord / 1000 - 20;

        await this.sendCommand("set_pointclean", [this.getCurrentMovementMode(), x_coord, y_coord], {});
    }

    async driveHome() {
        await this.sendCommand("set_charge", [1]);
    }

    /**
     * @private
     *
     * @returns {ViomiMovementMode}
     */
    getCurrentMovementMode() {
        const currentMovementMode = this.robotState.getFirstMatchingAttributeByConstructor(stateAttrs.MovementModeStateAttribute);

        if (currentMovementMode) {
            if (currentMovementMode.metaData.viomiMode !== undefined) {
                return ViomiMovementMode.ZONED_CLEAN_OR_MOPPING;
            } else {
                switch (currentMovementMode.value) {
                    case stateAttrs.MovementModeStateAttribute.VALUE.REGULAR:
                        return ViomiMovementMode.NORMAL_CLEANING;
                    case stateAttrs.MovementModeStateAttribute.VALUE.MOP:
                        return ViomiMovementMode.MOP_MOVES;
                    case stateAttrs.MovementModeStateAttribute.VALUE.OUTLINE:
                        return ViomiMovementMode.OUTLINE;
                }
            }
        } else {
            return ViomiMovementMode.NORMAL_CLEANING;
        }
    }

    /**
     * @private
     *
     * @param {object} options
     * @param {ViomiMovementMode} [options.movementMode] //If unset, we'll use the current value
     * @param {ViomiOperation} options.operation //Stop/Start/Pause
     * @param {Array} [options.additionalParameters]
     *
     * @returns {Promise<object>}
     */
    startOperation(options) {
        let command = "set_mode";
        let operation = [undefined, options.operation];

        if (options.movementMode === undefined) {
            operation[0] = this.getCurrentMovementMode();
        } else {
            operation[0] = options.movementMode;
        }

        if (Array.isArray(options.additionalParameters)) {
            command = "set_mode_withroom";
            operation.push(options.additionalParameters.length);
            operation = operation.concat(options.additionalParameters);
        }

        return this.sendCommand(command, operation);

    }

    async startCleaning() {
        await this.startOperation({
            operation: ViomiOperation.START,
            additionalParameters: []
            //Intentional empty array to force set_mode_withroom command since the viomi api is utterly broken
        });
    }

    /** @param {Array<number>} zone_ids */
    async startCleaningZonesById(zone_ids) {
        await this.stopCleaning();

        const zones = this.configuration.getZones();
        const zone_ids_from_map = zone_ids.filter(id => !zones.get(id).user);
        const zones_from_user = zone_ids.map(id => zones.get(id)).filter(z => z.user);

        if (zone_ids_from_map.length && zones_from_user.length) {
            throw new Error("Cannot start cleaning rooms and custom zones simultaneously");
        }

        if (zone_ids_from_map.length) {
            await this.startOperation({
                operation: ViomiOperation.START,
                additionalParameters: zone_ids_from_map
            });
        } else if (zones_from_user.length) {
            const areas = [];
            zones_from_user.forEach(z => areas.push(...z.areas));

            const specs = toZoneSpec(areas, /*restricted=*/ false);
            /** @type {Array} */
            const args = [specs.length];

            await this.sendCommand("set_zone", args.concat(specs));

            await this.startOperation({
                operation: ViomiOperation.START,
                movementMode: ViomiMovementMode.ZONED_CLEAN_OR_MOPPING
            });
        } else {
            throw new Error("No zones to clean");
        }
    }

    /**
     * Starts cleaning rooms / map segments by their given numeric id.
     *
     * @param {Array<number>} segment_ids
     * @returns {Promise<void>}
     */
    async startCleaningSegments(segment_ids) {
        if (segment_ids.length) {
            this.startOperation({
                operation: ViomiOperation.START,
                additionalParameters: segment_ids
            });
        } else {
            throw new Error("No segments to clean");
        }
    }

    async pauseCleaning() {
        await this.startOperation({operation: ViomiOperation.PAUSE});
    }

    async stopCleaning() {
        await this.startOperation({operation: ViomiOperation.STOP});
    }

    /** @override */
    async getFanSpeeds() {
        Logger.info("Get FanSpeeds");

        return this.fanSpeeds;
    }

    /** @override */
    async setFanSpeed(speed) {
        if (typeof speed === "string") {
            if (FAN_GRADES[speed] !== undefined) {
                await this.sendCommand("set_suction", [FAN_GRADES[speed]]);
                await this.pollStatus();
                return;
            }
        }

        throw new Error("invalid fan speed: " + speed);
    }

    async getWirelessNetworkInfo() {
        const output = {
            connected: false
        };


        if (this.model.isEmbedded()) {
            /*
                root@rockrobo:~# iw
                Usage:  iw [options] command
                Do NOT screenscrape this tool, we don't consider its output stable.

                :-)
             */
            const iwOutput = spawnSync("iw", ["dev", "wlan0", "link"]).stdout;

            if (iwOutput) {
                const WIFI_CONNECTED_IW_REGEX = /^Connected to ([0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2}:[0-9a-f]{2})(?:.*\s*)SSID: (.*)\s*freq: ([0-9]*)\s*signal: ([-]?[0-9]* dBm)\s*tx bitrate: ([0-9.]* .*)/;

                const extractedWifiData = iwOutput.toString().match(WIFI_CONNECTED_IW_REGEX);
                if (extractedWifiData) {
                    output.connected = true;
                    output.connectionParameters = {
                        bssid: extractedWifiData[1],
                        ssid: extractedWifiData[2],
                        rssi: extractedWifiData[4]
                    };
                }
            }
        }

        return output;
    }
}

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

const STATUS_PROP_MAP = Object.freeze({
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
const ERROR_PROP_MAP = Object.freeze({
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

module.exports = Viomi;