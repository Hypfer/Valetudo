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
        if (fs.existsSync(this.location)) {
            Logger.info("Loading configuration file:", this.location);

            try {
                this.settings = Object.assign(
                    this.settings,
                    JSON.parse(fs.readFileSync(this.location, {"encoding": "utf-8"})));
                this.adoptLegacyAreas();
                this.persist();
            } catch (e) {
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

    /** @returns {Map<number, Configuration.Zone>} */
    getZones() {
        return new Map(this.get("zones"));
    }

    /** @param {Map<number, Configuration.Zone>} zones */
    setZones(zones) {
        this.set("zones", [...zones]);
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
    }

    persist() {
        fs.writeFileSync(this.location, JSON.stringify(this.settings, null, 2));
    }

    /**
     * Migrate legacy "areas" to "zones". Added in 2020-03, probably reasonable to remove by 2022.
     */
    adoptLegacyAreas() {
        if (this.settings["zones"] === undefined && this.settings["areas"] !== undefined) {
            /** @type {Array<Configuration.Zone>} */
            const zones = this.settings["areas"].map(
                (v, i) => ({
                    id: -(i + 1),
                    name: v[0],
                    areas: v[1] ? Array.isArray(v[1]) ? v[1] : [v[1]] : [],
                    user: true
                }));
            this.setZones(new Map(zones.map(v => [v.id, v])));
            delete this.settings["areas"];
        }
    }
}

/** @typedef {Array<number>} Configuration.Area */

/**
 * @typedef {{
 *      id: number,
 *      name: string,
 *      areas?: Array<Configuration.Area>,
 *      user: boolean
 * }} Configuration.Zone
 * Negative IDs are used for user-defined zones, which also have the user=true attribute set.
 * Those cannot be edited by the UI.
 */

module.exports = Configuration;
