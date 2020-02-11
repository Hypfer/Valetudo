// @ts-check
const dgram = require("dgram");
const {EventEmitter} = require('events');
const MiioSocket = require("./MiioSocket");

/**
 *
 * @param options {object}
 * @param options.spoofedIP {string} The IP we've told miio we are
 * @param options.cloudKey {Buffer} The pre-shared unique key of your robot
 * @param options.deviceId {string} The unique Device-id of your robot
 * @param options.bindIP {string} "127.0.0.1" on the robot, "0.0.0.0" in development
 * @param options.mapUploadHost {string} "127.0.0.1" on the robot, ??? in development
 * @param options.events {EventEmitter}
 * @param options.onConnected {function} function to call after completing a handshake
 * @constructor
 */
const Dummycloud = function(options) {
    this.spoofedIP = options.spoofedIP;
    this.bindIP = options.bindIP;

    this.socket = dgram.createSocket("udp4");
    this.socket.bind(8053, this.bindIP);

    this.socket.on("listening", () => {
        console.info("Dummycloud is spoofing " + this.spoofedIP + ":8053 on " + this.bindIP +":8053");
    });

    this.miioSocket = new MiioSocket({
        socket: this.socket,
        token: options.cloudKey,
        onMessage: this.handleMessage.bind(this),
        onConnected: options.onConnected,
        deviceId: options.deviceId,
        rinfo: undefined,
        timeout: undefined,
        name: 'cloud'
    });

    // This gets overwritten by Valetudo.js
    this.onMessage = function(msg) { return true; };
};

Dummycloud.prototype.handleMessage = function(msg) {
    // some default handling.
    switch (msg.method) {
        case "_otc.info":
            this.miioSocket.sendMessage({
                "id": msg.id,
                "result": {
                    "otc_list": [{"ip": this.spoofedIP, "port": 8053}],
                    "otc_test": {
                        "list": [{"ip": this.spoofedIP, "port": 8053}],
                        "interval": 1800,
                        "firsttest": 1193
                    }
                }
            });
            return;
    }
    if (!this.onMessage(msg)) {
        console.info("Unknown cloud message received:", JSON.stringify(msg));
    }
};

/**
 * Shutdown Dummycloud
 * @returns {Promise<void>}
 */
Dummycloud.prototype.shutdown = function() {
    return new Promise((resolve, reject) => {
        console.debug("Dummycloud shutdown in progress...");

        try {
            this.socket.disconnect();
        } catch(err) {
            // do nothing, no connection is open
        }
        this.socket.close(() => {
            console.debug("Dummycloud shutdown done");
            resolve();
        });
    });
};

module.exports = Dummycloud;