const fs = require("fs");
const Tools = require("./Tools");
const path = require("path");
const Logger = require("./Logger");
const DEFAULT_SETTINGS = require("./res/default_settings.json");

class Configuration {

    constructor() {
        this.settings = DEFAULT_SETTINGS;

        if (fs.existsSync("/mnt/data/")) {
            this.location = "/mnt/data/valetudo/config.json";
        } else if (fs.existsSync("/mnt/UDISK/")) {
            this.location = "/mnt/UDISK/config/valetudo.json";
        } else {
            this.location = "develop/local/config.json";
        }

        /* load an existing configuration file. if it is not present, create it using the default configuration */
        if(fs.existsSync(this.location)) {
            Logger.info("Loading configuration file:", this.location);

            try {
                this.settings = Object.assign(this.settings, JSON.parse(fs.readFileSync(this.location, {"encoding": "utf-8"})));
                this.persist();
            } catch(e) {
                Logger.error("Invalid configuration file!");
                Logger.info("Writing new file using defaults");

                this.persist();
            }
        } else {
            Logger.info("No configuration file present. Creating one at:", this.location);
            Tools.MK_DIR_PATH(path.dirname(this.location));
            this.persist();
        }
    }

    /**
     * @param key {string}
     * @returns {*}
     */
    get(key) {
        return this.settings[key];
    }

    getAll() {
        return this.settings;
    }

    /**
     * @param key {string}
     * @param val {string|object}
     */
    set(key, val) {
        this.settings[key] = val;

        this.persist();
    }

    persist() {
        fs.writeFileSync(this.location, JSON.stringify(this.settings, null, 2));
    }
}

module.exports = Configuration;
