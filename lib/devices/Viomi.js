const MiioDevice = require("./MiioDevice");
const zlib = require("zlib");
const ViomiMapParser = require("../ViomiMapParser");

/**
 * Implements the viomi.vacuum.v7 device.
 *
 * Still incomplete contributions are welcome.
 * @constructor
 * @implements {MiioDevice}
 */
const Viomi = function(options) {
    MiioDevice.call(this, options);
};
Viomi.prototype = Object.create(MiioDevice.prototype);
Viomi.prototype.constructor = Viomi;

Viomi.prototype.onMessage = function(msg) {
    switch (msg.method) {
        case "_sync.gen_tmp_presigned_url":
        case "_sync.gen_presigned_url":
            let key = 'urls'; // default key
            if (msg.params && msg.params.suffix)
                key = msg.params.suffix;

            let result = {};
            result[key] = [];

            for (let i = 0; i < 4; i++) {
                let url = this.mapUploadHost +
                          "/api/miio/map_upload_handler?ts=" + process.hrtime() + "&suffix=" + key;
                result[key].push({'url': url, 'method': 'GET'});
            }
            this.sendCloud({id: msg.id, "result": result});
            return true;
    }

    if (msg.method.startsWith('prop.')) {
        const newState = {};
        newState[msg.method.substr(5)] = msg.params[0];
        this.updateStatus(newState);
        return true;
    }
    return false;
};

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
    0: 'IDLE',
    1: 'IDLE',
    2: 'IDLE',
    3: 'CLEANING',
    4: 'RETURNING_HOME',
    5: 'CHARGING'
};

Viomi.prototype.updateStatus = function(newState) {
    if ('run_state' in newState) {
        this.status.state = STATUS_MAP[newState['run_state']];
        this.status.human_state = this.status.state;
    }
    if ('err_state' in newState) {
        this.status.error_code = newState['err_state']; // TODO adopt to viomi codes
        this.status.human_error = 'Error_' + this.status.error_code;
    }
    if ('battary_life' in newState)
        this.status.battery = newState['battary_life'];
    if ('s_time' in newState)
        this.status.clean_time = newState['s_time'];
    if ('s_area' in newState)
        this.status.clean_area = newState['s_area'] * 1000 * 1000; // m² to mm²
    this.events.emit("miio.status", this.status);
};

Viomi.prototype.pollStatus = function(callback) {
    this.sendLocal("get_prop", STATE_PROPERTIES, {}, (err, res) => {
        let statusDict = {};
        STATE_PROPERTIES.forEach((key, index) => statusDict[key] = res[index]);
        this.updateStatus(statusDict);
        callback();
    });
};

Viomi.prototype.getCurrentStatus = function(callback) {
    callback(null, this.status);
};

Viomi.prototype.pollMap = function(callback) {
    this.sendLocal("set_uploadmap", [2], {timeout: 2000}, callback);
};

Viomi.prototype.preprocessMap = function(data, callback) {
    return zlib.inflate(data, callback);
};

Viomi.prototype.parseMap = function(data) {
    return new ViomiMapParser(data).parse();
};

/*
 * Coordinates are in mm and need to be in raw and unflipped format.
 * Viomi might not support the goto command. We interpret this as a point clean
 * (goTo(x,y); spotClean();)
 */
Viomi.prototype.goTo = function(x_coord, y_coord, callback) {
    x_coord = x_coord / 1000 - 20;
    y_coord = y_coord / 1000 - 20;
    this.sendLocal("set_pointclean", [2, x_coord, y_coord], {}, callback)
};

module.exports = Viomi;