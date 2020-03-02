const MiioVacuum = require("./MiioVacuum");
const zlib = require("zlib");
const ViomiMapParser = require("../ViomiMapParser");

/**
 * Implements the viomi.vacuum.v7 device.
 * Still incomplete contributions are welcome.
 * @implements {MiioVacuum}
 */
class Viomi extends MiioVacuum {
    /**
    * @constructor
    */
    constructor(options) {
        super(options);
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

    updateStatus(newState) {
        if ("run_state" in newState) {
            const oldStateFastPull = MiioVacuum.FAST_MAP_PULLING_STATES.indexOf(this.status.state);
            this.status.state = STATUS_MAP[newState["run_state"]];
            this.status.human_state = this.status.state;
            const newStateFastPull = MiioVacuum.FAST_MAP_PULLING_STATES.indexOf(this.status.state);
            if (newStateFastPull && !oldStateFastPull)
                this.pollMap();
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
        this.events.emit("miio.status", this.status);
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
        return new ViomiMapParser(data).parse();
    }

    /*
     * Coordinates are in mm and need to be in raw and unflipped format.
     * Viomi might not support the goto command. We interpret this as a point clean
     * (goTo(x,y); spotClean();)
     */
    goTo(x_coord, y_coord) {
        x_coord = x_coord / 1000 - 20;
        y_coord = ViomiMapParser.MAX_MAP_HEIGHT - 1 - y_coord;
        y_coord = y_coord / 1000 - 20;
        let mode = 1; // TODO: figure out the available modes
        return this.sendLocal("set_pointclean", [mode, x_coord, y_coord], {});
    }

    driveHome() {
        return this.sendLocal("set_charge", [1]);
    }

    stopCleaning() {
        return this.sendLocal("set_mode", [0]);
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
    507: "LOCATION_ERROR",
    2105: "CHARGE_COMPLETED",
    2103: "CHARGING"
});

module.exports = Viomi;