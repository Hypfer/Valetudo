const cronstrue = require("cronstrue");
const zlib = require("zlib");
const spawnSync = require("child_process").spawnSync;
const NotImplementedError = require("./NotImplementedError");
const MiioVacuum = require("./MiioVacuum");
const RRMapParser = require("../RRMapParser");
const entities = require("../entities");

/**
 * Implements the roborock device.
 */
class Roborock extends MiioVacuum {
    constructor(options) {
        super(options);
        this.lastMapPoll = new Date(0);
    }

    onMessage(msg) {
        switch (msg.method) {
            case "props":
                this.updateStatus(msg.params);
                this.sendCloud({ id: msg.id, result: "ok" });
                return true;
            case "event.status":
                if (msg.params &&
                    msg.params[0] &&
                    msg.params[0].state !== undefined
                ) {
                    this.updateStatus(msg.params[0]);
                    this.pollMap();
                }
                this.sendCloud({ id: msg.id, result: "ok" });
                return true;
            case "_sync.getctrycode":
                this.sendCloud({
                    id: msg.id, result: { ctry_code: "DE" } //TODO
                });
                return true;
            case "_sync.getAppData":
                this.sendCloud({
                    id: msg.id,
                    error: {
                        code: -6,
                        message: "not set app data"
                    }
                });
                return true;
            case "_sync.gen_tmp_presigned_url":
            case "_sync.gen_presigned_url":
            case "_sync.batch_gen_room_up_url": {
                let mapUploadUrls = [];
                for (let i = 0; i < 4; i++) {
                    mapUploadUrls.push(this.mapUploadHost + "/api/miio/map_upload_handler?" +
                                       process.hrtime());
                }
                this.sendCloud({ id: msg.id, result: mapUploadUrls });
                return true;
            }
            case "event.back_to_dock": //TODO
            case "event.error_code":
            case "event.bin_full": //TODO: bring to UI
            case "event.relocate_failed_back":
            case "event.goto_target_succ":
            case "event.target_not_reachable":
            case "event.consume_material_notify":
            case "event.segment_map_done":
            case "event.clean_complete":
            case "event.low_power_back": //If the robot is currently cleaning and the battery drops below 20% it drives home to charge
                this.sendCloud({ id: msg.id, result: "ok" });
                return true;
        }
        return false;
    }

    pollMap() {
        // Guard against multiple concurrent polls.
        if (this.pollingMap) {
            return;
        }

        const now = new Date();
        if (now.getTime() - 600 > this.lastMapPoll.getTime()) {
            this.pollingMap = true;
            this.lastMapPoll = now;

            // Clear pending timeout, since we’re starting a new poll right now.
            if (this.pollMapTimeout) {
                clearTimeout(this.pollMapTimeout);
            }

            this.sendCloud({"method": "get_map_v1"}).then(res => {
                if (Array.isArray(res) && res.length === 1) {
                    let repollSeconds = 60;

                    let StatusStateAttribute = this.robotState.getFirstMatchingAttribute({
                        attributeClass: entities.state.attributes.StatusStateAttribute.name
                    });

                    if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
                        repollSeconds = 2;
                    }

                    if (res && res[0] === "retry") {
                        repollSeconds += 1;
                    }

                    setTimeout(() => this.pollMap(), repollSeconds * 1000);
                }
            }, err => {
                // ¯\_(ツ)_/¯
            }).finally(() => {
                this.pollingMap = false;
            });
        }

        this.pollMapTimeout = setTimeout(() => this.pollMap(), 5 * 60 * 1000); // 5 minutes
    }

    preprocessMap(data) {
        return new Promise((resolve, reject) => {
            zlib.gunzip(data, (err, result) => err ? reject(err) : resolve(result));
        });
    }

    parseMap(data) {
        this.robotState.map = RRMapParser.PARSE(data);

        return this.robotState.map;
    }

    parseStatus(res) {
        if (res["msg_ver"] !== undefined && !this.fanSpeeds) {
            this.detectFanSpeeds(res["msg_ver"]);
        }

        if (res["state"] !== undefined && STATUS_MAP[res["state"]]) {
            let statusValue = STATUS_MAP[res["state"]].value;
            let statusFlag = STATUS_MAP[res["state"]].flag;
            let statusMetaData = {};

            if (statusValue === entities.state.attributes.StatusStateAttribute.VALUE.PAUSED && res["in_cleaning"] !== 0) {
                statusFlag = entities.state.attributes.StatusStateAttribute.FLAG.RESUMABLE;

                if (res["in_cleaning"] === 2) {
                    //Since this is some roborock-related weirdness, we're using the metaData to store this
                    statusMetaData.zoned = true;
                }
            } else if (statusValue === entities.state.attributes.StatusStateAttribute.VALUE.ERROR) {
                statusMetaData.error_code = res["error_code"];
                statusMetaData.error_description = GET_ERROR_CODE_DESCRIPTION(res["error_code"]);
            }

            this.robotState.upsertFirstMatchingAttribute(new entities.state.attributes.StatusStateAttribute({
                value: statusValue,
                flag: statusFlag,
                metaData: statusMetaData
            }));
        }

        if (res["fan_power"] !== undefined) {
            let matchingFanSpeed = Object.keys(this.fanSpeeds).find(key => this.fanSpeeds[key] === res["fan_power"]);
            if (!matchingFanSpeed) {
                matchingFanSpeed = entities.state.attributes.FanSpeedStateAttribute.VALUE.CUSTOM;
            }

            this.robotState.upsertFirstMatchingAttribute(new entities.state.attributes.FanSpeedStateAttribute({
                value: matchingFanSpeed,
                customValue: matchingFanSpeed === entities.state.attributes.FanSpeedStateAttribute.VALUE.CUSTOM ? res["fan_power"] : undefined
            }));
        }

        if (res["battery"] !== undefined) {
            this.robotState.upsertFirstMatchingAttribute(new entities.state.attributes.BatteryStateAttribute({
                level: res["battery"] || 0
            }));
        }

        if (res["clean_area"]) { //TODO: actually not an attribute. Use Job
            this.robotState.upsertFirstMatchingAttribute(new entities.state.attributes.LatestCleanupStatisticsAttribute({
                type: entities.state.attributes.LatestCleanupStatisticsAttribute.TYPE.AREA,
                value: Math.round(parseInt(res["clean_area"]) / 100)
            }));
        }

        if (res["clean_time"]) {
            this.robotState.upsertFirstMatchingAttribute(new entities.state.attributes.LatestCleanupStatisticsAttribute({
                type: entities.state.attributes.LatestCleanupStatisticsAttribute.TYPE.DURATION,
                value: res["clean_time"]
            }));
        }

        let persistentMapSetting = entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.DISABLED;
        if (res["lab_status"] === 1) {
            persistentMapSetting = entities.state.attributes.PersistentMapSettingStateAttribute.VALUE.ENABLED;
        }

        this.robotState.upsertFirstMatchingAttribute(new entities.state.attributes.PersistentMapSettingStateAttribute({
            value: persistentMapSetting
        }));

        //res["dnd_enabled"]
        //res["map_present"]
    }

    async pollStatus() {
        await this.getCurrentStatus();
    }

    /**
     * Starts cleaning
     */
    async startCleaning() {
        const StatusStateAttribute = this.robotState.getFirstMatchingAttributeByConstructor(entities.state.attributes.StatusStateAttribute);

        //This is very ugly and should've been handled by the roborock firmware itself
        if (
            StatusStateAttribute &&
            StatusStateAttribute.value === entities.state.attributes.StatusStateAttribute.VALUE.PAUSED &&
            StatusStateAttribute.flag === entities.state.attributes.StatusStateAttribute.FLAG.RESUMABLE &&
            StatusStateAttribute.metaData.zoned === true
        ) {
            await this.resumeCleaningZone();
        } else {
            await this.sendCommand("app_start", [], {});
        }
    }

    /**
     * Stops cleaning
     */
    async stopCleaning() {
        await this.sendCommand("app_stop", [], {});
    }

    /**
     * Pause cleaning
     */
    async pauseCleaning() {
        await this.sendCommand("app_pause", [], {});
    }

    /**
     * Resumes zone cleaning after being paused
     */
    async resumeCleaningZone() {
        await this.sendCommand("resume_zoned_clean", [], {});
    }

    async driveHome() {
        await this.sendCommand("app_charge", []);
    }

    async spotClean() {
        await this.sendCommand("app_spot", [], {});
    }

    async startManualControl() {
        await this.sendCommand("app_rc_start", [], {});
    }

    async stopManualControl() {
        await this.sendCommand("app_rc_end", [], {});
    }

    async setManualControl(angle, velocity, duration, sequenceId) {
        await this.sendCommand(
            "app_rc_move",
            [{"omega": angle, "velocity": velocity, "seqnum": sequenceId, "duration": duration}], {});
    }

    /**
     * Returns carpet detection parameter like
     * {
     *      'enable': 1,
     *      'current_integral': 450,
     *      'current_low': 400,
     *      'current_high': 500,
     *      'stall_time': 10
     * }
     */
    async getCarpetMode() {
        return await this.sendCommand("get_carpet_mode", [], {});
    }

    async setCarpetMode(enable, current_integral, current_low, current_high, stall_time) {
        await this.sendCommand(
            "set_carpet_mode",
            [{
                "enable": (enable === true ? 1 : 0),
                "stall_time": parseInt(stall_time),
                "current_low": parseInt(current_low),
                "current_high": parseInt(current_high),
                "current_integral": parseInt(current_integral)
            }],
            {});
    }

    /**
     * Play sound to locate robot
     */
    async findRobot() {
        await this.sendCommand("find_me", [], {});
    }

    /**
     * Get a list of all timers
     * Returns an array of timers as plain objects:
     * {
     *     id: "1530115775048",
     *     cron: "* 2 * * *",
     *     enabled: true
     * }
     */
    async getTimers() {
        return await this.sendCommand("get_timer", [], {})
            .then((response) => {
                const timers = [];
                let err;

                response.forEach(function(elem){
                    if (!Array.isArray(elem) || (Array.isArray(elem) && elem.length < 3)){
                        err = new Error("Invalid response");
                    } else {
                        timers.push({
                            id: elem[0],
                            cron: elem[2][0],
                            enabled: elem[1] === "on",
                            human_desc: cronstrue.toString(elem[2][0])
                        });
                    }
                });

                if (err) {
                    throw err;
                } else {
                    return timers;
                }
            });
    }

    /**
     * Set a new timer
     * @abstract
     * @param {string} cron
     */
    async addTimer(cron) {
        throw new NotImplementedError();
    }

    /**
     * Deletes the timer with the given id
     *
     * @param {string} id
     */
    async deleteTimer(id) {
        await this.sendCommand("del_timer", [id], {});
    }

    /**
     * Sets the timer with the given id to the given state
     *
     * @param {string} id
     * @param {boolean} enabled
     */
    async toggleTimer(id, enabled) {
        await this.sendCommand("upd_timer", [id, enabled === true ? "on" : "off"], {});
    }

    /**
     * Returns json dnd timer in the following format
     * {
     *      'enabled': 1,
     *      'start_minute': 0,
     *      'end_minute': 0,
     *      'start_hour': 22,
     *      'end_hour': 8
     * }
     */
    async getDndTimer() {
        return await this.sendCommand("get_dnd_timer", [], {});
    }

    /**
     * Set dnd timer
     *
     * @param {number} start_hour
     * @param {number} start_minute
     * @param {number} end_hour
     * @param {number} end_minute
     */
    async setDndTimer(start_hour, start_minute, end_hour, end_minute) {
        await this.sendCommand("set_dnd_timer",
            [start_hour, start_minute, end_hour, end_minute], {});
    }

    /**
     * Disable dnd
     */
    async deleteDndTimer() {
        await this.sendCommand("close_dnd_timer", [""], {});
    }

    /**
     * Get Timezone
     */
    async getTimezone() {
        let res = await this.sendCommand("get_timezone", [], {});
        return res[0];
    }

    /**
     * Set Timezone
     *
     * @param {string} new_zone new timezone
     */
    async setTimezone(new_zone) {
        await this.sendCommand("set_timezone", [new_zone], {});
    }

    /**
     * @abstract
     * @protected
     * @param msg_ver
     */
    detectFanSpeeds(msg_ver) {
        throw new NotImplementedError();
    }

    /**
     * Get possible fan speeds
     *
     * @public
     * @returns {Promise<{[id: string]: string}>}
     */
    async getFanSpeeds() {
        if (!this.fanSpeeds) {
            await this.getCurrentStatus();
        }

        return this.fanSpeeds;
    }

    /**
    * Set fan speed
    *
    * @param {string|number} speed id from getFanSpeeds or internal number
    */
    async setFanSpeed(speed) {
        if (typeof speed === "string") {
            if (this.fanSpeeds[speed] === undefined) {
                throw new Error("invalid speed");
            }
            speed = this.fanSpeeds[speed];
        }
        await this.sendCommand("set_custom_mode", [speed], {});
    }

    async setSoundVolume(volume) {
        await this.sendCommand("change_sound_volume", [parseInt(volume)], {});
    }

    async getSoundVolume() {
        let res = await this.sendCommand("get_sound_volume", [], {});
        return res[0];
    }

    async testSoundVolume() {
        await this.sendCommand("test_sound_volume", [], {});
    }

    async resetConsumable(consumable) {
        await this.sendCommand("reset_consumable", [consumable], {});
    }

    async configureWifi(ssid, password) {
        await this.sendCommand("miIO.config_router", {"ssid": ssid, "passwd": password, "uid": 0}, {});
    }

    /**
     * Starts the installation of a new voice pack
     * Returns an object like this:
     *  {
     *      "progress": 0,
     *      "state": 0,
     *      "error": 0
     *  }
     *
     *
     * @param {string} url
     * @param {string} md5
     */
    async installVoicePack(url, md5) {
        return await this.sendCommand("dnld_install_sound", {"url": url, "md5": md5, "sid": 10000}, {});
    }

    /**
     * Returns the current voice pack installation status
     * Returns an object like this:
     *  {
     *      "sid_in_progress": 10000,
     *      "progress": 100,
     *      "state": 2,
     *      "error": 0
     *  }
     */
    async getVoicePackInstallationStatus() {
        let res = await this.sendCommand("get_sound_progress", [], {});
        return res[0];
    }

    /*
    * FTR, response from robot is:
    *  {
    *      msg_ver: 2,
    *      msg_seq: 11,
    *      state: 8,
    *      battery: 100,
    *      clean_time: 0,
    *      clean_area: 0,
    *      error_code: 0,
    *      map_present: 0,
    *      in_cleaning: 0,
    *      dnd_enabled: 0
    *      fan_power: 60,
    *  }
    */
    async getCurrentStatus() {
        const response = await this.sendCommand("get_status", {});

        if (response) {
            this.updateStatus(response[0]);
        }

        return this.robotState;
    }

    /**
     * Returns the current status of the robots consumables
     */
    async getConsumableStatus() {
        let data = await this.sendCommand("get_consumable", [], {});
        return {
            mainBrushLeftTime: Math.max(0, 300 - (data[0].main_brush_work_time / 60 / 60)), // convert to hours left
            sideBrushLeftTime: Math.max(0, 200 - (data[0].side_brush_work_time / 60 / 60)), // convert to hours left
            filterLeftTime: Math.max(0, 150 - (data[0].filter_work_time / 60 / 60)), // convert to hours left
            sensorLeftTime: Math.max(0, 30 - (data[0].sensor_dirty_time / 60 / 60)) // convert to hours left
        };
    }

    /**
     * Returns the cleaning history
     */
    async getCleanSummary() {
        let data = await this.sendCommand("get_clean_summary", [], {});
        return {
            cleanTime: data[0] / 60 / 60, // convert to hours
            cleanArea: data[1] / 1000000, // convert to m²
            cleanCount: data[2],
            lastRuns: data[3] // array containing up to 20 runs from the past
        };
    }

    /**
     * Returns record of a specific cleaning run.
     * This requires a unique recordId that is provided in the (optional) list attached to getCleanSummary.
     *
     * @param {number} recordId id of the record the details should be fetched for
     */
    async getCleanRecord(recordId) {
        let data = await this.sendCommand("get_clean_record", [recordId], {});

        return {
            startTime: data[0][0] * 1000, // convert to ms
            endTime: data[0][1] * 1000,   // convert to ms
            duration: data[0][2],
            area: data[0][3] / 1000000,
            errorCode: data[0][4],
            errorDescription: GET_ERROR_CODE_DESCRIPTION(data[0][4]),
            finished: (data[0][5] === 1)
        };
    }


    /**
     * Resets all persistent data (map, nogo areas and virtual walls)
     */
    async resetMap() {
        await this.sendCommand("reset_map", [], {});
    }

    /* Some words on coordinates for goTo and startCleaningZone:
    Coordinates need to be in mm and need to be in raw and unflipped format.
    */
    async goTo(x_coord, y_coord) {
        await this.sendCommand("app_goto_target", [x_coord * 10, 51200 - y_coord * 10], {});
    }

    /** @param {Array<number>} zone_ids */
    async startCleaningZonesById(zone_ids) {
        let zones = this.configuration.getZones();
        /** @type {Array<import('../Configuration').Area>} */
        let areasToClean = [];
        /** @type {Array<string>} */
        let zoneNames = [];
        zone_ids.forEach((zone_id) => {
            let zone = zones.get(zone_id);
            if (zone) {
                areasToClean = areasToClean.concat(zone.areas);
                zoneNames.push(zone.name);
            }
        });
        if (areasToClean.length && zoneNames.length) {
            this.zoneCleaningStatus = zoneNames;
            await this.startCleaningZoneByCoords(areasToClean);
        } else {
            throw new Error("Zone names not found.");
        }
    }

    /**
     * Returns the names of currently cleaned Zones
     */
    getZoneCleaningStatus() {
        return this.zoneCleaningStatus;
    }

    /**
     * @param {Array<Array<number>>} zones is an array of areas to clean:  [[x1, y1, x2, y2,
     *     iterations],..]
     */
    async startCleaningZoneByCoords(zones) {
        if (Array.isArray(zones) && zones.length <= 5) {
            const flippedZones = zones.map(zone => {
                const yFlippedZone = [
                    zone[0] * 10,
                    RRMapParser.DIMENSION_MM - zone[1] * 10,
                    zone[2] * 10,
                    RRMapParser.DIMENSION_MM - zone[3] * 10,
                    zone[4] * 10
                ];

                // it seems as the vacuum only works with 'positive rectangles'! So flip the coordinates if the user entered them wrong.
                // x1 has to be < x2 and y1 < y2
                return [
                    yFlippedZone[0] > yFlippedZone[2] ? yFlippedZone[2] : yFlippedZone[0],
                    yFlippedZone[1] > yFlippedZone[3] ? yFlippedZone[3] : yFlippedZone[1],
                    yFlippedZone[0] > yFlippedZone[2] ? yFlippedZone[0] : yFlippedZone[2],
                    yFlippedZone[1] > yFlippedZone[3] ? yFlippedZone[1] : yFlippedZone[3],
                    yFlippedZone[4]
                ];
            });

            await this.sendCommand("app_zoned_clean", flippedZones, {});
        } else {
            throw new Error("Zones must be array of at most 5 zones.");
        }
    }

    /**
     * Saves the persistent data like virtual walls and nogo zones
     *
     * @public
     * @abstract
     * @param {any} persistantData //TODO define a better type
     * @returns {Promise<void>}
     */
    async savePersistentData(persistantData) {
        throw new NotImplementedError();
    }

    /**
     * Sets the lab status aka persistent data feature of the S50
     *
     * @public
     * @abstract
     * @param {boolean} flag true for enabling lab mode and false for disabling
     * @returns {Promise<void>}
     */
    async setLabStatus(flag) {
        throw new NotImplementedError();
    }

    onStatusChange(changedProperties) {
    }

    async getWirelessNetworkInfo() {
        let res = await this.sendCommand("get_network_info");
        const output = {
            connected: false
        };

        if (res === "unknown_method" && this.model.isEmbedded()) {
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
        } else {
            output.connected = typeof res === "object" && res.bssid !== "";

            output.connectionParameters = {
                bssid: res.bssid,
                rssi: res.rssi,
                ssid: res.ssid,
                ip: res.ip,
                mac: res.mac
            };
        }

        return output;
    }
}


/** Device specific status code mapping. */
const STATUS_MAP = {
    1: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.IDLE
    },
    2: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.IDLE
    },
    3: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.IDLE
    },
    4: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    5: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.CLEANING
    },
    6: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.RETURNING
    },
    7: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.MANUAL_CONTROL
    },
    8: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.DOCKED
    },
    9: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.IDLE
    },
    10: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.PAUSED
    },
    11: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.CLEANING,
        flag: entities.state.attributes.StatusStateAttribute.FLAG.SPOT
    },
    12: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.ERROR
    },
    13: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.IDLE
    },
    14: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.IDLE
    },
    15: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.RETURNING
    },
    16: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.MOVING,
        flag: entities.state.attributes.StatusStateAttribute.FLAG.TARGET
    },
    17: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.CLEANING,
        flag: entities.state.attributes.StatusStateAttribute.FLAG.ZONE
    },
    18: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.CLEANING,
        flag: entities.state.attributes.StatusStateAttribute.FLAG.SECTION
    },
    100: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.DOCKED
    },
    101: {
        value: entities.state.attributes.StatusStateAttribute.VALUE.ERROR
    }
};

const ERROR_CODES = {
    0: "No error",
    1: "Laser distance sensor error",
    2: "Collision sensor error",
    3: "Wheels on top of void, move robot",
    4: "Clean hovering sensors, move robot",
    5: "Clean main brush",
    6: "Clean side brush",
    7: "Main wheel stuck?",
    8: "Device stuck, clean area",
    9: "Dust collector missing",
    10: "Clean filter",
    11: "Stuck in magnetic barrier",
    12: "Low battery",
    13: "Charging fault",
    14: "Battery fault",
    15: "Wall sensors dirty, wipe them",
    16: "Place me on flat surface",
    17: "Side brushes problem, reboot me",
    18: "Suction fan problem",
    19: "Unpowered charging station",
};

const GET_ERROR_CODE_DESCRIPTION = (errorCodeId) => {
    if (ERROR_CODES[errorCodeId] !== undefined) {
        return ERROR_CODES[errorCodeId];
    } else {
        return "UNKNOWN ERROR CODE";
    }
};

module.exports = Roborock;