const dgram = require("dgram");
const Dummycloud = require("../miio/Dummycloud");
const Logger = require("../Logger");
const MiioSocket = require("../miio/MiioSocket");
const RetryWrapper = require("../miio/RetryWrapper");
const Status = require("../miio/Status");

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

        // Poll status once per minute.
        let pollStatusLoop = () => {
            let repollSeconds =
                MiioVacuum.FAST_MAP_PULLING_STATES.indexOf(this.status.state) !== -1 ? 2 : 60;
            setTimeout(pollStatusLoop, repollSeconds * 1000);
        };
        pollStatusLoop();
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

    /** Initial preprocessing (e.g. decompression) of the map data. */
    preprocessMap(data, callback) {}

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
     * @return {Promise<object>}
     */
    driveHome() {
        return Promise.reject("not implemented");
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
