const fs = require("fs");
const {EventEmitter} = require("events");
const path = require("path");
const os = require("os");

const Tools = require("./Tools");
const Logger = require("./Logger");
const DEFAULT_SETTINGS = require("./res/default_config.json");

class Configuration {

    constructor() {
        /** @private */
        this.eventEmitter = new EventEmitter();
        this.settings = DEFAULT_SETTINGS;

        this.location = process.env.VALETUDO_CONFIG_PATH || path.join(os.tmpdir(), "valetudo_config.json");

        /* load an existing configuration file. if it is not present, create it using the default configuration */
        if (fs.existsSync(this.location)) {
            Logger.info("Loading configuration file:", this.location);

            try {
                this.settings = Object.assign(
                    this.settings,
                    JSON.parse(fs.readFileSync(this.location, {"encoding": "utf-8"}).toString())
                );

                this.persist();
            } catch (e) {
                Logger.error("Invalid configuration file!");
                Logger.info("Writing new file using defaults");

                try {
                    fs.renameSync(this.location, this.location + ".backup");
                    Logger.info("Backup moved to " + this.location + ".backup");
                } catch (e) {
                    Logger.info("Failed to move backup", e);
                }

                this.persist();
            }
        } else {
            Logger.info("No configuration file present. Creating one at:", this.location);
            Tools.MK_DIR_PATH(path.dirname(this.location));

            this.persist();
        }
    }

    /**
     * @param {string} key
     * @returns {*}
     */
    get(key) {
        return this.settings[key];
    }

    getAll() {
        return this.settings;
    }

    /**
     * @param {string} key
     * @param {string|object} val
     */
    set(key, val) { //TODO: set nested
        this.settings[key] = val;

        this.persist();
        this.eventEmitter.emit(CONFIG_UPDATE_EVENT, key);
    }

    persist() {
        fs.writeFileSync(this.location, JSON.stringify(this.settings, null, 2));
    }

    /**
     * @public
     * @param {(key) => void} listener
     */
    onUpdate(listener) {
        this.eventEmitter.on(CONFIG_UPDATE_EVENT, listener);
    }
}

const CONFIG_UPDATE_EVENT = "ConfigUpdated";

module.exports = Configuration;
