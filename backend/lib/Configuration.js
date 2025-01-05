const Ajv = require("ajv");
const EventEmitter = require("events").EventEmitter;
const fs = require("fs");
const nestedObjectAssign = require("nested-object-assign");
const os = require("os");
const path = require("path");

const DEFAULT_SETTINGS = require("./res/default_config.json");
const env = require("./res/env");
const Logger = require("./Logger");
const SCHEMAS = require("./doc/Configuration.openapi.json");
const Tools = require("./utils/Tools");

class Configuration {

    constructor() {
        /** @private */
        this.eventEmitter = new EventEmitter();
        this.settings = structuredClone(DEFAULT_SETTINGS);

        this.location = process.env[env.ConfigPath] ?? path.join(os.tmpdir(), "valetudo_config.json");

        this.loadConfig();
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
    set(key, val) {
        this.settings[key] = val;

        this.persist();
        this.eventEmitter.emit(CONFIG_UPDATE_EVENT, key);
    }

    persist() {
        try {
            fs.writeFileSync(this.location, this.getSerializedConfig());
        } catch (e) {
            Logger.error("Error while persisting configuration", e);
        }
    }

    /**
     * @public
     * @param {(key: string) => void} listener
     */
    onUpdate(listener) {
        this.eventEmitter.on(CONFIG_UPDATE_EVENT, listener);
    }

    /**
     * @private
     */
    loadConfig() {
        /* load an existing configuration file. if it is not present or invalid, create it using the default configuration */
        if (fs.existsSync(this.location)) {
            Logger.info("Loading configuration file:", this.location);

            try {
                //@ts-ignore
                const ajv = new Ajv({removeAdditional: true});
                Object.keys(SCHEMAS.components.schemas).forEach(schemaName => {
                    ajv.addSchema(SCHEMAS.components.schemas[schemaName], "#/components/schemas/" + schemaName);
                });

                const config = fs.readFileSync(this.location, {"encoding": "utf-8"}).toString();
                const parsedConfig = JSON.parse(config);

                if (parsedConfig._version !== Tools.GET_VALETUDO_VERSION()) {
                    Logger.info(`Migrating config from ${parsedConfig._version} to ${Tools.GET_VALETUDO_VERSION()}`);

                    // BEGIN migration code to be removed with the next version

                    // END migration code to be removed with the next version

                    parsedConfig._version = Tools.GET_VALETUDO_VERSION();
                }

                if (!ajv.validate(SCHEMAS.components.schemas.Configuration, parsedConfig)) {
                    Logger.error("Error while validating configuration file", ajv.errors);

                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error("Schema Validation Error");
                }

                this.settings = nestedObjectAssign(
                    {},
                    this.settings,
                    parsedConfig
                );

                if (this.getSerializedConfig() !== config) {
                    Logger.info(`Schema changes were applied to the configuration file at: ${this.location}`);

                    this.persist();
                }
            } catch (e) {
                Logger.error("Invalid configuration file: ", e.message);
                Logger.info("Writing new configuration file using defaults");

                try {
                    fs.renameSync(this.location, this.location + ".backup");
                    Logger.info(`Backup moved to ${this.location}.backup`);
                } catch (e) {
                    Logger.info("Failed to move backup", e);
                }

                this.settings._version = Tools.GET_VALETUDO_VERSION();
                this.persist();
            }
        } else {
            Logger.info(`No configuration file present. Creating one at: ${this.location}`);
            Tools.MK_DIR_PATH(path.dirname(this.location));

            this.persist();
        }
    }

    /**
     * @public
     */
    reset() {
        Logger.info("Restoring config to default settings.");

        // A config reset should not reset the robot config
        const robotSettings = this.settings.robot;

        this.settings = structuredClone(DEFAULT_SETTINGS);
        this.settings.robot = robotSettings;

        this.persist();

        Object.keys(this.settings).forEach(key => {
            this.eventEmitter.emit(CONFIG_UPDATE_EVENT, key);
        });
    }

    /**
     * @private
     */
    getSerializedConfig() {
        return JSON.stringify(this.settings, null, 2);
    }
}

const CONFIG_UPDATE_EVENT = "ConfigUpdated";

module.exports = Configuration;
