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
    * @constructor
    * @param options {object}
    * @param options.cloudKey {Buffer} The pre-shared unique key of your robot
    * @param options.configuration {import('../Configuration')}
    * @param options.deviceId {string} The unique Device-id of your robot
    * @param options.events {import("events").EventEmitter}
    * @param options.ip {string} Remote IP
    * @param options.tokenProvider {()=>Buffer}
    */
    constructor(options) {
        this.status = new Status();
        this.events = options.events;
        this.configuration = options.configuration;
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
                doTimesync: false
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
     * @param {any} msg the json object sent by the remote device
     * @returns boolean True if the message was handled.
     */
    onMessage(msg) {
        return false;
    }

    /** Called once the dummycloud connection was established. */
    onCloudConnected() {
        Logger.info("Cloud connected");
        // start polling the map after a brief delay of 3.5s
        setTimeout(() => this.pollMap(), 3500);
    }

    async pollStatus() {}

    /**
     * Returns the current status of the robot
     * @returns {Promise<Status>}
     */
    getCurrentStatus() {
        return;
    }

    /** Poll the map. */
    pollMap() {}

    /**
     * Initial preprocessing (e.g. decompression) of the map data.
     *
     * @param {Buffer} data
     * @returns {Promise<Buffer>}
     */
    async preprocessMap(data) {
        return data;
    }

    /** Parse the preprocessed map data. */
    parseMap(data) {}

    /**
     * Sends a {'method': method, 'params': args} message to the robot.
     * Uses the cloud socket if available or falls back to the local one.
     * @param {string} method
     * @param {object|Array} args
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    sendLocal(method, args = [], options = {}) {
        if (this.dummycloud.miioSocket.connected) {
            return this.dummycloud.miioSocket.sendMessage({"method": method, "params": args}, options);
        } else {
            return this.localRetryWrapper.sendMessage(method, args, options);
        }
    }

    /**
     * Sends a json object to cloud socket.
     * @param {object} msg JSON object to send.
     * @param {object} options
     * @param {number=} options.timeout custom timeout in milliseconds
     * @return {Promise<object>}
     */
    sendCloud(msg, options = {}) {
        return this.dummycloud.miioSocket.sendMessage(msg, options);
    }

    getTokens() {
        return {
            cloud: this.dummycloud.miioSocket.codec.token.toString("hex"),
            local: this.localRetryWrapper.miioSocket.codec.token.toString("hex")
        };
    }

    /**
     * Go back to the dock
     *
     * @abstract
     * @return {Promise<object>}
     */
    async driveHome() {
        throw new NotImplementedError();
    }

    /**
     * Starts cleaning
     *
     * @abstract
     * @return {Promise<object>}
     */
    async startCleaning() {
        throw new NotImplementedError();
    }

    /**
     * Stops cleaning
     *
     * @abstract
     * @return {Promise<object>}
     */
    async stopCleaning() {
        throw new NotImplementedError();
    }

    /**
     * Pause cleaning
     *
     * @abstract
     * @return {Promise<object>}
     */
    async pauseCleaning() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @return {Promise<object>}
     */
    async spotClean() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {Array<number>} zone_ids
     * @returns {Promise<object>}
     */
    async startCleaningZonesById(zone_ids) {
        throw new NotImplementedError();
    }

    /**
     * zones is an array of areas to clean:  [[x1, y1, x2, y2, iterations],..]
     *
     * @abstract
     * @return {Promise<object>}
     */
    async startCleaningZoneByCoords(zones) {
        throw new NotImplementedError();
    }

    /**
     * Resumes zone cleaning after being paused
     *
     * @abstract
     * @return {Promise<object>}
     */
    async resumeCleaningZone() {
        throw new NotImplementedError();
    }

    /**
     * Move to coordinates
     *
     * @abstract
     * @param {number} x_coord
     * @param {number} y_coord
     * @return {Promise<object>}
     */
    async goTo(x_coord, y_coord) {
        throw new NotImplementedError();
    }

    /**
     * Play sound to locate robot
     *
     * @abstract
     * @return {Promise<object>}
     */
    async findRobot() {
        throw new NotImplementedError();
    }

    /**
     * @typedef ConsumableStatus
     * @property {number} main_brush_work_time
     * @property {number} side_brush_work_time
     * @property {number} filter_work_time
     * @property {number} sensor_dirty_time
     */
    /**
     * Returns the current status of the robots consumables
     *
     * @abstract
     * @returns {Promise<ConsumableStatus>}
     */
    async getConsumableStatus() {
        throw new NotImplementedError();
    }

    /**
     * Returns the cleaning history
     *
     * @abstract
     * @returns {Promise<any[]>}
     */
    async getCleanSummary() {
        throw new NotImplementedError();
    }

    /**
     * Returns record of a specific cleaning run.
     *
     * @abstract
     * @param recordId id of the record the details should be fetched for
     * @returns {Promise<object>}
     */
    async getCleanRecord (recordId) {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {any[]}
     */
    getZoneCleaningStatus() {
        throw new NotImplementedError();
    }

    /**
     * Set fan speed
     *   0-100: percent
     *   Or presets:
     *   101: quiet
     *   102: balanced
     *   103: Turbo
     *   104: Max
     *   105: Mop
     *
     * @abstract
     * @param {number} speed
     */
    async setFanSpeed(speed) {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<object>}
     */
    async getAppLocale() {
        throw new NotImplementedError();
    }

    /**
     * Get a list of all timers
     *
     * @abstract
     * @returns {Promise<object>}
     */
    async getTimers() {
        throw new NotImplementedError();
    }

    /**
     * Set a new timer
     *
     * @abstract
     * @param cron {string}
     * @returns {Promise<object>}
     */
    async addTimer(cron) {
        throw new NotImplementedError();
    }

    /**
     * Sets the timer with the given id to the given state
     *
     * @abstract
     * @param id {string}
     * @param enabled {boolean}
     * @returns {Promise<object>}
     */
    async toggleTimer(id, enabled) {
        throw new NotImplementedError();
    }

    /**
     * Deletes the timer with the given id
     *
     * @abstract
     * @param id {string}
     * @returns {Promise<object>}
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
     * @abstract
     * @returns {Promise<DndTimer>}
     */
    async getDndTimer() {
        throw new NotImplementedError();
    }

    /**
     * Set dnd timer
     *
     * @abstract
     * @param {number} start_hour
     * @param {number} start_minute
     * @param {number} end_hour
     * @param {number} end_minute
     * @returns {Promise<object>}
     */
    async setDndTimer(start_hour, start_minute, end_hour, end_minute) {
        throw new NotImplementedError();
    }

    /**
     * Disable dnd
     *
     * @abstract
     * @returns {Promise<object>}
     */
    async deleteDndTimer() {
        throw new NotImplementedError();
    }

    /**
     * Get Timezone
     *
     * @abstract
     * @returns {Promise<object>}
     */
    async getTimezone() {
        throw new NotImplementedError();
    }

    /**
     * Set Timezone
     *
     * @abstract
     * @param new_zone new timezone
     * @returns {Promise<object>}
     */
    async setTimezone(new_zone) {
        throw new NotImplementedError();
    }

    /**
     * Sets the lab status aka persistent data feature of the S50
     *
     * @abstract
     * @param {boolean} flag true for enabling lab mode and false for disabling
     * @returns {Promise<object>}
     */
    async setLabStatus(flag) {
        throw new NotImplementedError();
    }

    /**
     * Resets all persistent data (map, nogo areas and virtual walls)
     *
     * @abstract
     * @returns {Promise<object>}
     */
    async resetMap() {
        throw new NotImplementedError();
    }

    /**
     * Saves the persistent data like virtual walls and nogo zones
     *
     * @abstract
     * @param persistantData
     * @returns {Promise<void>}
     */
    async savePersistentData(persistantData) {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {string} volume
     * @returns {Promise<object>}
     */
    async setSoundVolume(volume) {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<object>}
     */
    async getSoundVolume() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<object>}
     */
    async testSoundVolume() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<object>}
     */
    async resetConsumable(consumable) {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {string} ssid
     * @param {string} password
     * @returns {Promise<object>}
     */
    async configureWifi(ssid, password) {
        throw new NotImplementedError();
    }

    /**
     * Starts the installation of a new voice pack
     *
     * @abstract
     * @param url {string}
     * @param md5 {string}
     * @returns {Promise<object>}
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
     * @abstract
     * @returns {Promise<VoicePackInstallationStatus>}
     */
    async getVoicePackInstallationStatus() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<object>}
     */
    async startManualControl() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<object>}
     */
    async stopManualControl() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {number} angle
     * @param {number} velocity
     * @param {number} duration
     * @param {number} sequenceId
     * @returns {Promise<object>}
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
     * @returns {Promise<object>}
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

module.exports = MiioVacuum;
