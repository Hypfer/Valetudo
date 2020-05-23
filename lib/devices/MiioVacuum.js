const dgram = require("dgram");
const Dummycloud = require("../miio/Dummycloud");
const Logger = require("../Logger");
const MiioSocket = require("../miio/MiioSocket");
const RetryWrapper = require("../miio/RetryWrapper");
const Status = require("../miio/Status");
const NotImplementedError = require("./NotImplementedError");

/**
 * Common Base class for devices that can be controled by Valetudo.
 *
 * Yet incomplete. Only the Roborock implementation is authoritative atm.
 */
class MiioVacuum {
    /**
     * @param {object} options
     * @param {Buffer} options.cloudKey The pre-shared unique key of your robot
     * @param {import('../Configuration')} options.configuration
     * @param {number} options.deviceId The unique Device-id of your robot
     * @param {import("../Events")} options.events
     * @param {string} options.ip Remote IP
     * @param {()=>Buffer} options.tokenProvider
     * @param {import("../miio/Model")} options.model
     */
    constructor(options) {
        this.status = new Status();
        this.events = options.events;
        this.configuration = options.configuration;
        this.model = options.model;
        this.mapUploadHost = this.configuration.get("map_upload_host");

        this.dummycloud = new Dummycloud({
            spoofedIP: this.configuration.get("dummycloud").spoofedIP,
            cloudKey: options.cloudKey,
            deviceId: options.deviceId,
            bindIP: this.configuration.get("dummycloud").bindIP,
            onConnected: () => this.onCloudConnected(),
            onMessage: msg => this.onMessage(msg)
        });

        let createLocalSocket = (token, address) => {
            const socket = dgram.createSocket("udp4");
            socket.bind();

            return new MiioSocket({
                socket: socket,
                token: token,
                onMessage: null,
                deviceId: undefined,
                rinfo: {address: address, port: MiioSocket.PORT},
                timeout: undefined,
                onConnected: undefined,
                name: "local",
                isServerSocket: false
            });
        };

        this.localRetryWrapper = new RetryWrapper(
            createLocalSocket(options.tokenProvider(), options.ip),
            options.tokenProvider
        );

        // Poll status once per minute (or more frequent during operation)
        let pollStatusLoop = () => {
            let repollSeconds =
                MiioVacuum.FAST_MAP_PULLING_STATES.indexOf(this.status.state) !== -1 ? 2 : 60;
            setTimeout(() => this.pollStatus().finally(pollStatusLoop), repollSeconds * 1000);
        };
        this.pollStatus().finally(pollStatusLoop);
    }

    /**
     * Called when a message is received, either from cloud or local interface.
     *
     * @protected
     * @param {any} msg the json object sent by the remote device
     * @returns {boolean} True if the message was handled.
     */
    onMessage(msg) {
        return false;
    }

    /**
     * Called once the dummycloud connection was established.
     *
     * @protected
     */
    onCloudConnected() {
        Logger.info("Cloud connected");
        // start polling the map after a brief delay of 3.5s
        setTimeout(() => this.pollMap(), 3500);
    }

    /**
     * @protected
     * @abstract
     * @returns {Promise<void>}
     */
    async pollStatus() {
        throw new NotImplementedError();
    }

    /**
     * Called upon receiving updated status.
     * Computes the diff to previous state, emits the miio.status event and calls onStatusChange.
     *
     * @protected
     * @param {Object<string, any>} newState json object as received from the robot.
     */
    updateStatus(newState) {
        // create a copy of the old state, to later compute the diff
        const oldState = Object.assign({}, this.status);

        // save all model-specific properties, we shouldn't use these, but logging
        // state-changes for those too is insightful.
        const modelName = this.model.name + "_";
        for (const k in newState) {
            this.status[modelName + k] = newState[k];
        }

        // Compute the device-specific updates to this.status.
        this.parseStatus(newState);

        // Compute the diff
        const diff = {};
        for (let k in this.status) {
            if (oldState[k] != this.status[k]) {
                diff[k] = this.status[k];
            }
        }

        // Deal with any changes that we observed.
        const diffKeys = Object.keys(diff);
        if (diffKeys.length != 0) {
            Logger.trace("New Status:", diff);
            this.events.emitStatusUpdated(this.status);
            this.onStatusChange(diffKeys);
        }
    }

    /**
     * Device-specific parsing of state dicts.
     * Updates the this.status object in-place.
     *
     * @protected
     * @abstract
     * @param {Object<string, any>} newState json object as received from the robot
     */
    parseStatus(newState) {
        throw new NotImplementedError();
    }

    /**
     * Called upon changes in device status.
     *
     * @protected
     * @abstract
     * @param {Array<string>} changedProperties keys of the this.status object that changed.
     */
    onStatusChange(changedProperties) {
        throw new NotImplementedError();
    }

    /**
     * Returns the current status of the robot
     *
     * @public
     * @abstract
     * @returns {Promise<Status>}
     */
    async getCurrentStatus() {
        throw new NotImplementedError();
    }

    /**
     * Poll the map.
     *
     * @protected
     * @abstract
     * @returns {void}
     */
    pollMap() {
        throw new NotImplementedError();
    }

    /**
     * Initial preprocessing (e.g. decompression) of the map data.
     *
     * @public
     * @param {Buffer} data
     * @returns {Promise<Buffer>}
     */
    async preprocessMap(data) {
        return data;
    }

    /**
     * Parse the preprocessed map data.
     *
     * @public
     * @abstract
     * @param {Buffer} data
     * @returns {object} //TODO define a better type
     */
    parseMap(data) {
        throw new NotImplementedError();
    }

    /**
     * Sends a {'method': method, 'params': args} message to the robot.
     * Uses the cloud socket if available or falls back to the local one.
     *
     * @protected
     * @param {string} method
     * @param {object|Array} args
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    sendCommand(method, args = [], options = {}) {
        if (this.dummycloud.miioSocket.connected) {
            return this.sendCloud({"method": method, "params": args}, options);
        } else {
            return this.localRetryWrapper.sendMessage(method, args, options);
        }
    }

    /**
     * Sends a json object to cloud socket.
     *
     * @protected
     * @param {object} msg JSON object to send.
     * @param {object} options
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    sendCloud(msg, options = {}) {
        return this.dummycloud.miioSocket.sendMessage(msg, options);
    }

    /**
     * @public
     * @returns {{cloud: string, local: string}}
     */
    getTokens() {
        return {
            cloud: this.dummycloud.miioSocket.codec.token.toString("hex"),
            local: this.localRetryWrapper.miioSocket.codec.token.toString("hex")
        };
    }

    /**
     * Go back to the dock
     *
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async driveHome() {
        throw new NotImplementedError();
    }

    /**
     * Starts cleaning
     *
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async startCleaning() {
        throw new NotImplementedError();
    }

    /**
     * Stops cleaning
     *
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async stopCleaning() {
        throw new NotImplementedError();
    }

    /**
     * Pause cleaning
     *
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async pauseCleaning() {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async spotClean() {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @param {Array<number>} zone_ids
     * @returns {Promise<void>}
     */
    async startCleaningZonesById(zone_ids) {
        throw new NotImplementedError();
    }

    /**
     * zones is an array of areas to clean:  [[x1, y1, x2, y2, iterations],..]
     *
     * @public
     * @abstract
     * @param {number[][]} zones //TODO define a better type
     * @returns {Promise<void>}
     */
    async startCleaningZoneByCoords(zones) {
        throw new NotImplementedError();
    }

    /**
     * Resumes zone cleaning after being paused
     *
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async resumeCleaningZone() {
        throw new NotImplementedError();
    }

    /**
     * Move to coordinates
     *
     * @public
     * @abstract
     * @param {number} x_coord
     * @param {number} y_coord
     * @returns {Promise<void>}
     */
    async goTo(x_coord, y_coord) {
        throw new NotImplementedError();
    }

    /**
     * Play sound to locate robot
     *
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async findRobot() {
        throw new NotImplementedError();
    }

    /**
     * @typedef ConsumableStatus
     * @property {number} mainBrushLeftTime time left for main brush in hours
     * @property {number} sideBrushLeftTime time left for side brush in hours
     * @property {number} filterLeftTime time left for filter in hours
     * @property {number} sensorLeftTime time left for sensor in hours
     */
    /**
     * Returns the current status of the robots consumables
     *
     * @public
     * @abstract
     * @returns {Promise<ConsumableStatus>}
     */
    async getConsumableStatus() {
        throw new NotImplementedError();
    }

    /**
     * @typedef CleanSummary
     * @property {number} cleanTime total time in seconds
     * @property {number} cleanArea total area in m²
     * @property {number} cleanCount total clean count
     * @property {number[]} lastRuns array of CleanRecord Ids
     */
    /**
     * Returns the cleaning history
     *
     * @public
     * @abstract
     * @returns {Promise<CleanSummary>}
     */
    async getCleanSummary() {
        throw new NotImplementedError();
    }

    /**
     * @typedef CleanRecord
     * @property {number} startTime timestamp run was started in milliseconds
     * @property {number} endTime timestamp run was finished in milliseconds
     * @property {number} duration duration in seconds
     * @property {number} area area in square-meter
     * @property {number} errorCode device specific error code
     * @property {string} errorDescription error message
     * @property {boolean} finished run completed
     */
    /**
     * Returns record of a specific cleaning run.
     *
     * @public
     * @abstract
     * @param {number} recordId id of the record the details should be fetched for
     * @returns {Promise<CleanRecord>}
     */
    async getCleanRecord(recordId) {
        throw new NotImplementedError();
    }

    /**
     * Returns the names of currently cleaned Zones
     *
     * @public
     * @abstract
     * @returns {string[]}
     */
    getZoneCleaningStatus() {
        throw new NotImplementedError();
    }

    /**
     * Get possible fan speeds
     *
     * @public
     * @abstract
     * @returns {Promise<{[id: string]: string}>}
     */
    async getFanSpeeds() {
        throw new NotImplementedError();
    }

    /**
     * Set fan speed
     *
     * @public
     * @abstract
     * @param {number|string} speed id from getFanSpeeds or internal number
     */
    async setFanSpeed(speed) {
        throw new NotImplementedError();
    }

    /**
     * @typedef AppLocale
     * @property {string} name
     * @property {string} bom
     * @property {string} location
     * @property {string} language
     * @property {string} timezone
     * @property {string} logserver
     */
    /**
     * @public
     * @abstract
     * @returns {Promise<AppLocale>}
     */
    async getAppLocale() {
        throw new NotImplementedError();
    }

    /**
     * @typedef Timer
     * @property {string} id
     * @property {string} cron timer-spec in crontab format
     * @property {boolean} enabled
     * @property {string} human_desc
     */
    /**
     * Get a list of all timers
     *
     * @public
     * @abstract
     * @returns {Promise<Timer[]>}
     */
    async getTimers() {
        throw new NotImplementedError();
    }

    /**
     * Set a new timer
     *
     * @public
     * @abstract
     * @param {string} cron
     * @returns {Promise<void>}
     */
    async addTimer(cron) {
        throw new NotImplementedError();
    }

    /**
     * Sets the timer with the given id to the given state
     *
     * @public
     * @abstract
     * @param {string} id
     * @param {boolean} enabled
     * @returns {Promise<void>}
     */
    async toggleTimer(id, enabled) {
        throw new NotImplementedError();
    }

    /**
     * Deletes the timer with the given id
     *
     * @public
     * @abstract
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteTimer(id) {
        throw new NotImplementedError();
    }

    /**
     * @typedef {object} DndTimer
     * @property {number} enabled
     * @property {number} start_minute
     * @property {number} end_minute
     * @property {number} start_hour
     * @property {number} end_hour
     */
    /**
     * Get dnd timer
     *
     * @public
     * @abstract
     * @returns {Promise<DndTimer>}
     */
    async getDndTimer() {
        throw new NotImplementedError();
    }

    /**
     * Set dnd timer
     *
     * @public
     * @abstract
     * @param {number} start_hour
     * @param {number} start_minute
     * @param {number} end_hour
     * @param {number} end_minute
     * @returns {Promise<void>}
     */
    async setDndTimer(start_hour, start_minute, end_hour, end_minute) {
        throw new NotImplementedError();
    }

    /**
     * Disable dnd
     *
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async deleteDndTimer() {
        throw new NotImplementedError();
    }

    /**
     * Get Timezone
     *
     * @public
     * @abstract
     * @returns {Promise<string>}
     */
    async getTimezone() {
        throw new NotImplementedError();
    }

    /**
     * Set Timezone
     *
     * @public
     * @abstract
     * @param {string} new_zone new timezone
     * @returns {Promise<void>}
     */
    async setTimezone(new_zone) {
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

    /**
     * Resets all persistent data (map, nogo areas and virtual walls)
     *
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async resetMap() {
        throw new NotImplementedError();
    }

    /**
     * @typedef {object} BackupMap
     * @property {number} id
     * @property {date} [timestamp]
     */
    /**
     * Returns a list of all existing backup maps
     *
     * @public
     * @abstract
     * @returns {Promise<Array<BackupMap>>}
     */
    async getBackupMaps() {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @param {BackupMap} backupMap
     * @returns {Promise<void>}
     */
    async restoreBackupMap(backupMap) {
        throw new NotImplementedError();
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
     * @public
     * @abstract
     * @param {string} volume
     * @returns {Promise<void>}
     */
    async setSoundVolume(volume) {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @returns {Promise<number>}
     */
    async getSoundVolume() {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async testSoundVolume() {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @param {string} consumable
     * @returns {Promise<void>}
     */
    async resetConsumable(consumable) {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @param {string} ssid
     * @param {string} password
     * @returns {Promise<void>}
     */
    async configureWifi(ssid, password) {
        throw new NotImplementedError();
    }

    /**
     * Starts the installation of a new voice pack
     *
     * @public
     * @abstract
     * @param {string} url
     * @param {string} md5
     * @returns {Promise<object>} //TODO define a better type or void
     */
    async installVoicePack(url, md5) {
        throw new NotImplementedError();
    }

    /**
     * @typedef {object} VoicePackInstallationStatus
     * @property {number} sid_in_progress
     * @property {number} progress
     * @property {number} state
     * @property {number} error
     */
    /**
     * Returns the current voice pack installation status
     *
     * @public
     * @abstract
     * @returns {Promise<VoicePackInstallationStatus>}
     */
    async getVoicePackInstallationStatus() {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async startManualControl() {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @returns {Promise<void>}
     */
    async stopManualControl() {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @abstract
     * @param {number} angle
     * @param {number} velocity
     * @param {number} duration
     * @param {number} sequenceId
     * @returns {Promise<void>}
     */
    async setManualControl(angle, velocity, duration, sequenceId) {
        throw new NotImplementedError();
    }

    /**
     * @typedef {object} CarpetModeParameters
     * @property {number} enable
     * @property {number} current_integral
     * @property {number} current_low
     * @property {number} current_high
     * @property {number} stall_time
     */
    /**
     * Returns carpet detection parameter like
     *
     * @abstract
     * @returns {Promise<CarpetModeParameters>}
     */
    async getCarpetMode() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {boolean} enable
     * @param {string} current_integral
     * @param {string} current_low
     * @param {string} current_high
     * @param {string} stall_time
     * @returns {Promise<void>}
     */
    async setCarpetMode(enable, current_integral, current_low, current_high, stall_time) {
        throw new NotImplementedError();
    }

    async shutdown() {
        Logger.debug("MiioVacuum shutdown in progress...");
        await this.dummycloud.shutdown();
        await this.localRetryWrapper.miioSocket.shutdown();
        Logger.debug("MiioVacuum shutdown done.");
    }
}

MiioVacuum.FAST_MAP_PULLING_STATES = [
    "REMOTE_CONTROL_ACTIVE",
    "CLEANING",
    "RETURNING_HOME",
    "MANUAL_MODE",
    "SPOT_CLEANING",
    "DOCKING",
    "GOING_TO_TARGET",
    "ZONED_CLEANING"
];

MiioVacuum.FAN_SPEEDS = Object.freeze({
    "MIN": "min",
    "LOW": "low",
    "MEDIUM": "medium",
    "HIGH": "high",
    "MAX": "max",
    "MOP": "mop" //TODO: refactor away from fan speed
});

module.exports = MiioVacuum;
