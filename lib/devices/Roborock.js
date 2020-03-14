const prettyCron = require("prettycron");
const zlib = require("zlib");
const MiioVacuum = require("./MiioVacuum");
const Tools = require("../Tools");
const RRMapParser = require("../RRMapParser");

/**
 * @extends {MiioVacuum}
 */
class Roborock extends MiioVacuum {
    /**
     * @constructor
     */
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
                    let repollSeconds = MiioVacuum.FAST_MAP_PULLING_STATES.indexOf(this.status.state) !== -1 ? 2 : 60;

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
        return RRMapParser.PARSE(data);
    }


    updateStatus(res) {
        this.status.state = STATUS_MAP[res["state"]];
        this.status.battery = res["battery"];
        this.status.clean_time = res["clean_time"];
        this.status.clean_area = res["clean_area"];
        this.status.error_code = res["error_code"];
        this.status.map_present = res["map_present"];
        this.status.in_cleaning = res["in_cleaning"];
        this.status.fan_power = res["fan_power"];
        this.status.dnd_enabled = res["dnd_enabled"];
        this.status.lab_status = res["lab_status"];

        this.status.human_state = this.status.state;
        this.status.human_error = Roborock.GET_ERROR_CODE_DESCRIPTION(this.status.error_code);

        this.events.emit("miio.status", this.status);
    }

    async pollStatus() {
        await this.getCurrentStatus();
    }

    /**
     * Starts cleaning
     */
    async startCleaning() {
        let res = await this.sendLocal("app_start", [], {});
        return res[0];
    }

    /**
     * Stops cleaning
     */
    async stopCleaning() {
        let res = await this.sendLocal("app_stop", [], {});
        return res[0];
    }

    /**
     * Pause cleaning
     */
    async pauseCleaning() {
        let res = await this.sendLocal("app_pause", [], {});
        return res[0];
    }

    /**
     * Resumes zone cleaning after being paused
     */
    async resumeCleaningZone() {
        let res = await this.sendLocal("resume_zoned_clean", [], {});
        return res[0];
    }

    async driveHome() {
        return await this.sendLocal("app_charge", []);
    }

    async spotClean() {
        let res = await this.sendLocal("app_spot", [], {});
        return res[0];
    }

    async startManualControl() {
        return await this.sendLocal("app_rc_start", [], {});
    }

    async stopManualControl() {
        return await this.sendLocal("app_rc_end", [], {});
    }

    async setManualControl(angle, velocity, duration, sequenceId) {
        return await this.sendLocal(
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
        return await this.sendLocal("get_carpet_mode", [], {});
    }

    async setCarpetMode(enable, current_integral, current_low, current_high, stall_time) {
        return await this.sendLocal(
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
        let res = await this.sendLocal("find_me", [], {});
        return res[0];
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
        return await this.sendLocal("get_timer", [], {})
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
                            // @ts-ignore
                            human_desc: prettyCron.toString(elem[2][0])
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
     * @param cron {string}
     */
    async addTimer(cron) {
        return await this.sendLocal("set_timer", [[Date.now().toString(),[cron, ["",""]]]], {});
    }

    /**
     * Deletes the timer with the given id
     * @param id {string}
     */
    async deleteTimer(id) {
        return await this.sendLocal("del_timer", [id], {});
    }

    /**
     * Sets the timer with the given id to the given state
     * @param id {string}
     * @param enabled {boolean}
     */

    async toggleTimer(id, enabled) {
        return await this.sendLocal("upd_timer", [id, enabled === true ? "on" : "off"], {});
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
        return await this.sendLocal("get_dnd_timer", [], {});
    }

    /**
     * Set dnd timer
     * @param start_hour
     * @param start_minute
     * @param end_hour
     * @param end_minute
     */
    async setDndTimer(start_hour, start_minute, end_hour, end_minute) {
        return await this.sendLocal("set_dnd_timer",
            [parseInt(start_hour), parseInt(start_minute), parseInt(end_hour), parseInt(end_minute)], {});
    }

    /**
     * Disable dnd
     */
    async deleteDndTimer() {
        return await this.sendLocal("close_dnd_timer", [""], {});
    }

    /**
     * Get Timezone
     */
    async getTimezone() {
        return await this.sendLocal("get_timezone", [], {});
    }

    /**
     * Set Timezone
     * @param new_zone new timezone
     */
    async setTimezone(new_zone) {
        return await this.sendLocal("set_timezone", [new_zone], {});
    }

    /*
        0-100: percent

        Or presets:
        101: quiet
        102: balanced
        103: Turbo
        104: Max
        105: Mop
    */
    async setFanSpeed(speed) {
        let res = await this.sendLocal("set_custom_mode", [parseInt(speed)], {});
        return res[0];
    }

    async setSoundVolume(volume) {
        let res = await this.sendLocal("change_sound_volume", [parseInt(volume)], {});
        return res[0];
    }

    async getSoundVolume() {
        let res = await this.sendLocal("get_sound_volume", [], {});
        return res[0];
    }

    async testSoundVolume() {
        return await this.sendLocal("test_sound_volume", [], {});
    }

    async resetConsumable(consumable) {
        let res = await this.sendLocal("reset_consumable", [consumable], {});
        return res[0];
    }

    async configureWifi(ssid, password) {
        return await this.sendLocal("miIO.config_router", {"ssid": ssid, "passwd": password, "uid": 0}, {});
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
     * @param url {string}
     * @param md5 {string}
     */
    async installVoicePack(url, md5) {
        return await this.sendLocal("dnld_install_sound", {"url": url, "md5": md5, "sid": 10000}, {});
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
        return await this.sendLocal("get_sound_progress", [], {});
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
    getCurrentStatus() {
        return this.sendLocal("get_status", {})
            .then((res) => {
                if (res) {
                    this.updateStatus(res[0]);
                }
                return this.status;
            });
    }

    /**
     * Returns the current status of the robots consumables
     * like this:
     *  {
     *      main_brush_work_time: 77974,
     *      side_brush_work_time: 77974,
     *      filter_work_time: 77974,
     *      sensor_dirty_time: 77808
     *  }
     */
    async getConsumableStatus() {
        let res = await this.sendLocal("get_consumable", [], {});
        return res[0];
    }

    /**
     * Returns the cleaning history
     *  like this:
     * [81234,1199407500,76,[1530283329,1530130601,...]]
     *
     * total time in seconds
     * total area in mm²
     * total clean count
     * [ array containing up to 20 runs from the past .. ]
     */
    async getCleanSummary() {
        return await this.sendLocal("get_clean_summary", [], {});
    }

    /**
     * Returns record of a specific cleaning run.
     * This requires a unique recordId that is provided in the (optional) list attached to getCleanSummary.
     * Result may look like:
     * {
     *  1550328301, //timestamp run was started
     *  1550329141, //timestamp run was finished
     *  840,        //duration in seconds
     *  14497500,   //=> 14.4975 m^2
     *  0,          //ErrorCode (references to Vacuum.ERROR_CODES)
     *  1           //CompletedFlag (0: did not complete, 1: did complete)
     * }
     * @param recordId id of the record the details should be fetched for
     */
    async getCleanRecord (recordId) {
        return await this.sendLocal("get_clean_record", [parseInt(recordId)], {});
    }

    /**
     * Sets the lab status aka persistent data feature of the S50
     * @param {boolean} flag true for enabling lab mode and false for disabling
     */
    async setLabStatus(flag) {
        const labStatus = flag ? 1 : 0;
        return await this.sendLocal("set_lab_status", [labStatus], {});
    }

    /**
     * Resets all persistent data (map, nogo areas and virtual walls)
     */
    async resetMap() {
        return await this.sendLocal("reset_map", [], {});
    }

    /* Some words on coordinates for goTo and startCleaningZone:
    Coordinates are in mm and need to be in raw and unflipped format.
    */
    async goTo(x_coord, y_coord) {
        return await this.sendLocal("app_goto_target", [x_coord, 51200 - y_coord], {});
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
                areasToClean.concat(zone.areas);
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
     * @returns {Array<string>}
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
                    zone[0],
                    Tools.DIMENSION_MM - zone[1],
                    zone[2],
                    Tools.DIMENSION_MM - zone[3],
                    zone[4]
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

            await this.sendLocal("app_zoned_clean", flippedZones, {});
        } else {
            throw new Error("Zones must be array of at most 5 zones.");
        }
    }

    /**
     * Saves the persistent data like virtual walls and nogo zones
     * They have to be provided in the following format:
     *      https://github.com/marcelrv/XiaomiRobotVacuumProtocol/issues/15#issuecomment-447647905
     *      Software barrier takes a vector of [id, x1,y1,x2,y2]
     *      And no-go zone takes [id, x1,y1,x2,y2,x3,y3,x4,y4], which are the corners of the zone rectangle?
     *      Edit: see @JensBuchta's comment. The first parameter appears to be a type: 0 = zone, 1 = barrier
     * @param persistantData
     */
    async savePersistentData(persistantData) { //TODO: Store in valetudo config
        if (Array.isArray(persistantData)) {
            const flippedYCoordinates = persistantData.map(data => {
                if (data[0] === 0) {
                    // this is a zone
                    return [
                        data[0],
                        data[1],
                        Tools.DIMENSION_MM - data[2],
                        data[3],
                        Tools.DIMENSION_MM - data[4],
                        data[5],
                        Tools.DIMENSION_MM - data[6],
                        data[7],
                        Tools.DIMENSION_MM - data[8]
                    ];
                } else {
                    // this is a barrier
                    return [
                        data[0],
                        data[1],
                        Tools.DIMENSION_MM - data[2],
                        data[3],
                        Tools.DIMENSION_MM - data[4],
                    ];
                }
            });

            this.sendLocal("save_map", flippedYCoordinates, {}).finally(() => {
                this.pollMap();
            });
        } else
            throw new Error("persistantData has to be an array.");
    }

    /**
     * This method provides some app details like:
     * {
     *  'location': 'de',
     *  'wifiplan': '',
     *  'logserver': 'awsde0.fds.api.xiaomi.com',
     *  'name': 'custom_A.03.0005_CE',
     *  'timezone': 'Europe/Berlin',
     *  'bom': 'A.03.0005',
     *  'language': 'en'
     * }
     */
    async getAppLocale() {
        return await this.sendLocal("app_get_locale", [], {});
    }
}

/** Device specific status code mapping. */
const STATUS_MAP = {
    1: "STARTING",
    2: "CHARGER_DISCONNECTED",
    3: "IDLE",
    4: "REMOTE_CONTROL_ACTIVE",
    5: "CLEANING",
    6: "RETURNING_HOME",
    7: "MANUAL_MODE",
    8: "CHARGING",
    9: "CHARGING_PROBLEM",
    10: "PAUSED",
    11: "SPOT_CLEANING",
    12: "ERROR",
    13: "SHUTTING_DOWN",
    14: "UPDATING",
    15: "DOCKING",
    16: "GOING_TO_TARGET",
    17: "ZONED_CLEANING",
    18: "SEGMENT_CLEANING",
    100: "CHARGING_COMPLETE",
    101: "DEVICE_OFFLINE"
};

Roborock.ERROR_CODES = {
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

Roborock.GET_ERROR_CODE_DESCRIPTION = (errorCodeId) => {
    if (Roborock.ERROR_CODES[errorCodeId] !== undefined) {
        return Roborock.ERROR_CODES[errorCodeId];
    } else {
        return "UNKNOWN ERROR CODE";
    }
};

module.exports = Roborock;