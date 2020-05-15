const Logger = require("../Logger");
const MiioVacuum = require("./MiioVacuum");
const ViomiMapParser = require("../ViomiMapParser");
const fs = require("fs");
const zlib = require("zlib");

/** @enum {number} */
const MopMode = Object.freeze({
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
 * Implements the viomi.vacuum.v7 device.
 * Still incomplete contributions are welcome.
 */
class Viomi extends MiioVacuum {
    constructor(options) {
        super(options);

        /**
         * Current cleaning operation.
         * [mode, pause/start (, opt: roomspec)]
         */
        this.operation = [0, 1, 0];

        /** @type {number} Current operation mode. Probably equal to MopMode with 3=zoned clean. */
        this.mode = 0;

        /** @type {MopMode} */
        this.mop_mode = MopMode.VACUUM;

        /** @type {BoxType} */
        this.box_type = BoxType.VACUUM;

        // Default the language to EN
        this.sendLocal("set_language", [2]);
    }

    onMessage(msg) {
        switch (msg.method) {
            case "_sync.gen_tmp_presigned_url":
            case "_sync.gen_presigned_url": {
                let key = "urls"; // default key
                if (msg.params && msg.params.suffix)
                    key = msg.params.suffix;

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
            const newState = {};
            newState[msg.method.substr(5)] = msg.params[0];
            this.updateStatus(newState);
            return true;
        }
        return false;
    }

    /** @override */
    parseStatus(newState) {
        if ("run_state" in newState) {
            const oldStateFastPull = MiioVacuum.FAST_MAP_PULLING_STATES.indexOf(this.status.state);
            this.status.state = STATUS_MAP[newState["run_state"]];
            this.status.human_state = this.status.state;
            const newStateFastPull = MiioVacuum.FAST_MAP_PULLING_STATES.indexOf(this.status.state);
            if (newStateFastPull && !oldStateFastPull)
                this.pollMap();
        }
        if ("is_charge" in newState) {
            this.status.is_charging = !newState["is_charge"];
        }
        if ("is_mop" in newState) {
            this.mop_mode = newState["is_mop"];
        }
        if ("mop_type" in newState) {
            this.status.has_mop = !!newState["mop_type"];
        }
        if ("box_type" in newState) {
            this.box_type = newState["box_type"];
        }
        if ("mode" in newState) {
            this.mode = newState["mode"];
        }
        if ("err_state" in newState) {
            let code = newState["err_state"]; // TODO adopt to viomi codes
            if (ERROR_MAP[code] !== undefined) {
                code = ERROR_MAP[code];
                this.status.error_code = code;
                if (code != "CHARGING" && code != "CHARGE_COMPLETED")
                    this.status.human_error = code;
            } else {
                this.status.error_code = code;
                this.status.human_error = "Error_" + this.status.error_code;
            }
        }
        if ("battary_life" in newState)
            this.status.battery = newState["battary_life"];
        if ("s_time" in newState)
            this.status.clean_time = newState["s_time"];
        if ("s_area" in newState)
            this.status.clean_area = newState["s_area"] * 1000 * 1000; // m² to mm²
    }

    /** @override */
    onStatusChange(changedProperties) {
        if (changedProperties.includes("box_type") || changedProperties.includes("mop_type")) {
            this.checkMopMode();
        }
    }

    /**
     * Enables mopping. Selects the correct mode based on the water tank type.
     *
     * @param {boolean} enable Whether to enable or disable mopping.
     */
    enableMopMode(enable) {
        let mode = enable
            ? (this.box_type == BoxType.VACUUM_AND_WATER ? MopMode.MIXED : MopMode.MOP)
            : MopMode.VACUUM;
        return this.sendLocal("set_mop", [mode]);
    }

    /** Checks that the mop mode setting is compatible with the current box_type and mop_type. */
    checkMopMode() {
        let mopping_enabled = this.mop_mode != MopMode.VACUUM;
        let vacuum_enabled = this.mop_mode != MopMode.MOP;
        if (this.box_type == BoxType.VACUUM && mopping_enabled) {
            Logger.info("Vacuum box doesn't support mopping. Mopping disabled.");
            this.enableMopMode(false);
            mopping_enabled = false;
            vacuum_enabled = true;
        } else if (this.box_type == BoxType.WATER && vacuum_enabled) {
            Logger.info("Walter-only tank doesn't support vacuuming. Setting to mop-only.");
            // (enableMopMode sets mop-only automatically based on the installed box).
            this.enableMopMode(true);
            mopping_enabled = true;
            vacuum_enabled = false;
        }
        if (!this.status.has_mop && mopping_enabled) {
            Logger.info("Mopping requires a mop. Mopping disabled.");
            this.enableMopMode(false);
            mopping_enabled = false;
        } else if (this.status.has_mop && !mopping_enabled &&
                (this.box_type == BoxType.WATER || this.box_type == BoxType.VACUUM_AND_WATER)) {
            Logger.info("Mop & water-tank installed, but mopping not enabled. Enabling mop-mode.");
            // If mop is installed and a water tank is present, assume user intent to be to mop.
            this.enableMopMode(true);
            mopping_enabled = true;
        }
    }

    async pollStatus() {
        let res = await this.sendLocal("get_prop", STATE_PROPERTIES);
        let statusDict = {};
        STATE_PROPERTIES.forEach((key, index) => statusDict[key] = res[index]);
        this.updateStatus(statusDict);
    }

    getCurrentStatus() {
        return Promise.resolve(this.status);
    }

    pollMap() {
        clearTimeout(this.pollMapTask);
        this.sendLocal("set_uploadmap", [2], {timeout: 2000}).finally(() => {
            let repollSeconds =
                MiioVacuum.FAST_MAP_PULLING_STATES.indexOf(this.status.state) !== -1 ? 5 : 300;
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
            Object.entries(map.zones).map(v => {
                const id = parseInt(v[0]);
                zones.set(id, {id: id, name: v[1].name, user: false});
            });
            this.configuration.setZones(zones);
            return map;
        } catch (e) {
            // save map data for later debugging
            let i = 0;
            let filename = "";
            do {
                filename = "/tmp/mapdata" + i++;
            } while (fs.existsSync(filename));

            fs.writeFile(filename, zlib.deflateSync(data), (err) => console.warn(err));
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
        let mode = 1; // TODO: figure out the available modes
        await this.sendLocal("set_pointclean", [mode, x_coord, y_coord], {});
    }

    async driveHome() {
        await this.sendLocal("set_charge", [1]);
    }

    /**
     * @private
     * @param {Array} operation See this.operation.
     * @returns {Promise<object>}
     */
    startOperation(operation) {
        this.operation = operation;
        if (operation.length > 2) {
            return this.sendLocal("set_mode_withroom", operation);
        } else {
            return this.sendLocal("set_mode", operation);
        }
    }

    async startCleaning() {
        this.operation[1] = 1;
        await this.startOperation(this.operation);
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
            /** @type {Array} */
            const args = [this.mode, 1, zone_ids_from_map.length];
            await this.startOperation(args.concat(zone_ids_from_map));
        } else if (zones_from_user.length) {
            const areas = [];
            zones_from_user.forEach(z => areas.push(...z.areas));
            const specs = toZoneSpec(areas, /*restricted=*/ false);
            /** @type {Array} */
            const args = [specs.length];
            await this.sendLocal("set_zone", args.concat(specs));
            this.mode = 3; // zoned clean
            await this.startOperation([this.mode, 1]);
        } else {
            throw new Error("No zones to clean");
        }
    }

    async pauseCleaning() {
        this.operation[1] = 2;
        await this.startOperation(this.operation);
    }

    async stopCleaning() {
        await this.startOperation([this.mode, 0]);
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

const STATUS_MAP = {
    0: "IDLE",
    1: "GOING_TO_TARGET",
    2: "IDLE",
    3: "CLEANING",
    4: "RETURNING_HOME",
    5: "CHARGING"
};

const ERROR_MAP = Object.freeze({
    // invalid mop mode (e.g. mop without mop installed)
    503: "INVALID_MOP_MODE",
    // robot cannot find its location, but its required for the specified mode (e.g. spot clean)
    507: "CANNOT_FIND_LOCATION", // spot clean
    510: "CANNOT_FIND_LOCATION", // return home
    2105: "CHARGE_COMPLETED",
    2102: "RETURNING_HOME", // point cleaning finished, returning home
    2103: "CHARGING",
    2104: "RETURNING_HOME", // aborted, returning home
});

module.exports = Viomi;