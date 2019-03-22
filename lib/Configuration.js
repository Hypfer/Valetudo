const fs = require("fs");
const Tools = require("./Tools");
const path = require("path");

/**
 * @constructor
 */
const Configuration = function() {
    this.location = process.env.VALETUDO_CONFIG ? process.env.VALETUDO_CONFIG : "/mnt/data/valetudo/config.json";
    this.settings = {
        "spots": [],
        "areas": [],
        "mqtt" : {
            enabled: false,
            identifier: "rockrobo",
            broker_url: "mqtt://foobar.example"
        }
    };

    /* load an existing configuration file. if it is not present, create it using the default configuration */
    if(fs.existsSync(this.location)) {
        console.log("Loading configuration file:", this.location);

        try {
            this.settings = JSON.parse(fs.readFileSync(this.location));
        } catch(e) {
            //TODO: handle this
            console.error("Invalid configuration file!");
            throw e;
        }
    } else {
        console.log("No configuration file present. Creating one at:", this.location);
        Tools.MK_DIR_PATH(path.dirname(this.location));
        this.persist();
    }
};


/**
 *
 * @param key {string}
 * @returns {*}
 */
Configuration.prototype.get = function(key) {
    return this.settings[key];
};

Configuration.prototype.getAll = function() {
    return this.settings;
};

/**
 *
 * @param key {string}
 * @param val {string}
 */
Configuration.prototype.set = function(key, val) {
    this.settings[key] = val;

    this.persist();
};

Configuration.prototype.persist = function() {
    fs.writeFile(this.location, JSON.stringify(this.settings, null, 2), (err) => {
        if (err) {
            console.error(err);
        }
    });
};

module.exports = Configuration;