// @ts-check
const {EventEmitter} = require('events');
const MiioSocket = require("../miio/MiioSocket");
const RetryWrapper = require("../miio/RetryWrapper");
const Status = require("../miio/Status");

/**
 * Common Base class for devices that can be controled by Valetudo.
 *
 * Yet incomplete. Only the Roborock implementation is authoritative atm.
 *
 * @param options {object}
 * @param options.localSocket {MiioSocket}
 * @param options.cloudSocket {MiioSocket}
 * @param options.events {EventEmitter}
 * @param options.ip {string} Remote IP
 * @param options.configuration {Configuration}
 * @param options.tokenProvider {function}
 * @constructor
 */
const MiioDevice = function(options) {
    this.cloudSocket = options.cloudSocket;
    this.localRetryWrapper =
        new RetryWrapper(options.localSocket, options.ip, options.tokenProvider);
    this.sendLocal = this.localRetryWrapper.sendMessage.bind(this.localRetryWrapper);

    this.configuration = options.configuration;
    this.mapUploadHost = this.configuration.get("map_upload_host");

    this.status = new Status();
    this.events = options.events;

    // Poll status once per minute.
    let pollStatusLoop = function() {
        let repollSeconds = FAST_MAP_PULLING_STATES.indexOf(this.status.state) !== -1 ? 2 : 60;
        setTimeout(() => this.pollStatus(pollStatusLoop), repollSeconds * 1000);
    }.bind(this);
    this.pollStatus(pollStatusLoop);
    this.sendLocal('get_curpos', {}, {}, () => {});  // TODO: add a loop to read current position
};

const FAST_MAP_PULLING_STATES = [
    'REMOTE_CONTROL_ACTIVE', 'CLEANING', 'RETURNING_HOME', 'MANUAL_MODE', 'SPOT_CLEANING',
    'DOCKING', 'GOING_TO_TARGET', 'ZONED_CLEANING'
];

/**
 * Called when a message is received, either from cloud or local interface.
 * @param {any} msg the json object sent by the remote device
 * @returns boolean True if the message was handled.
 */
MiioDevice.prototype.onMessage = function(msg) {
    return false;
};

MiioDevice.prototype.pollStatus = function(callback) {};
MiioDevice.prototype.pollMap = function(callback) {};

/** Initial preprocessing (e.g. decompression) of the map data. */
MiioDevice.prototype.preprocessMap = function(data, callback) {};

/** Parse the preprocessed map data. */
MiioDevice.prototype.parseMap = function(data) {};

MiioDevice.prototype.sendCloud = function(msg, callback) {
    this.cloudSocket.sendMessage(msg, {callback: callback});
};

MiioDevice.prototype.shutdown = async function() {
    console.debug("MiioDevice shutdown in progress...");
    await this.cloudSocket.shutdown();
    await this.localRetryWrapper.miioSocket.shutdown();
};

MiioDevice.prototype.getTokens = function() {
    return {
        cloud: this.cloudSocket.codec.token.toString("hex"),
        local: this.localRetryWrapper.miioSocket.codec.token.toString("hex")
    };
};

/**
 * Go back to the dock
 * Returns an error if there is one as the first parameter of the callback
 * On success, 2nd param of callback looks like this: 'ok'
 * @param callback
 */
MiioDevice.prototype.driveHome = function(callback) {
    this.sendLocal("set_charge", [1], {}, (err, res) => callback(err, err ? null : res[0]));
};

module.exports = MiioDevice;
