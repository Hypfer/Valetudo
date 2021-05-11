const fs = require("fs");
const os = require("os");
const path = require("path");
const {EventEmitter} = require("events");

const DEFAULT_SETTINGS = require("./res/default_config.json");
const Logger = require("./Logger");
const Tools = require("./Tools");

class Configuration {

    constructor() {
        /** @private */
        this.eventEmitter = new EventEmitter();
        this.settings = DEFAULT_SETTINGS;

        this.location = process.env.VALETUDO_CONFIG_PATH ?? path.join(os.tmpdir(), "valetudo_config.json");

        /* load an existing configuration file. if it is not present, create it using the default configuration */
        if (fs.existsSync(this.location)) {
            Logger.info("Loading configuration file:", this.location);

            try {
                this.settings = Object.assign(
                    this.settings,
                    JSON.parse(fs.readFileSync(this.location, {"encoding": "utf-8"}).toString())
                );

                // TODO: remove by release 2021.05.00
                this.migrateMqttConfig();

                this.persist();
            } catch (e) {
                Logger.error("Invalid configuration file: ", e.message);
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
     * Temporary! To be removed by release 2021.05.00
     *
     * @private
     */
    migrateMqttConfig() {
        if (this.settings.mqtt.homie !== undefined && this.settings.mqtt.homeassistant !== undefined) {
            return;
        }
        Logger.info("Migrating configuration");
        const backupLocation = this.location + ".migration-backup-" + Tools.GET_VALETUDO_VERSION();
        try {
            fs.writeFileSync(backupLocation, JSON.stringify(this.settings, null, 2));
            Logger.info("Configuration backup created:", backupLocation);
        } catch (err) {
            Logger.error("Failed to create configuration backup. Migration not performed, you may experience crashes", err);
            return;
        }

        this.settings.mqtt.homie = {
            enabled: true,
            addICBINVMapProperty: false,
            cleanAttributesOnShutdown: false,
        };
        this.settings.mqtt.homeassistant = {
            enabled: true,
            autoconfPrefix: this.settings.mqtt.autoconfPrefix ?? "homeassistant",
            cleanAutoconfOnShutdown: false
        };
        if (this.settings.mqtt.clean === undefined) {
            this.settings.mqtt.clean = false;
        }
        if (this.settings.mqtt.clientId === "") {
            this.settings.mqtt.clientId = null;
        }
        if (this.settings.mqtt.cleanTopicsOnShutdown === undefined) {
            this.settings.mqtt.cleanTopicsOnShutdown = false;
        }
        if (this.settings.mqtt.friendlyName === undefined) {
            this.settings.mqtt.friendlyName = this.settings.mqtt.identifier ?? "Valetudo Robot";
        }
        if (this.settings.mqtt.autoconfPrefix !== undefined) {
            delete this.settings.mqtt.autoconfPrefix;
        }
        if (this.settings.mqtt.homeassistantMapHack !== undefined) {
            delete this.settings.mqtt.homeassistantMapHack;
        }
        if (this.settings.mqtt.refreshInterval === undefined) {
            this.settings.mqtt.refreshInterval = 30;
        }
        if (this.settings.debug.debugHassAnchors === undefined) {
            this.settings.debug.debugHassAnchors = false;
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
