const dgram = require("dgram");
const MiioSocket = require("./MiioSocket");
const Logger = require("../Logger");

/**
 *
 * @param options {object}
 * @param options.spoofedIP {string} The IP we've told miio we are
 * @param options.cloudKey {Buffer} The pre-shared unique key of your robot
 * @param options.deviceId {string} The unique Device-id of your robot
 * @param options.bindIP {string} "127.0.0.1" on the robot, "0.0.0.0" in development
 * @param options.onConnected {function} function to call after completing a handshake
 * @param options.onMessage ((msg)=>void) function to call for incoming messages
 * @constructor
 */
const Dummycloud = function(options) {
    this.spoofedIP = options.spoofedIP;
    this.bindIP = options.bindIP;

    this.socket = dgram.createSocket("udp4");
    this.socket.bind(Dummycloud.PORT, this.bindIP);

    this.socket.on("listening", () => {
        Logger.info("Dummycloud is spoofing " + this.spoofedIP + ":8053 on " + this.bindIP + ":" +
                    Dummycloud.PORT);
    });

    this.miioSocket = new MiioSocket({
        socket: this.socket,
        token: options.cloudKey,
        onMessage: this.handleMessage.bind(this),
        onConnected: options.onConnected,
        deviceId: options.deviceId,
        rinfo: undefined,
        timeout: 2000,
        name: "cloud",
        doTimesync: true
    });

    this.onMessage = options.onMessage;
};

/** The miio port the dummycloud listens on. @const */
Dummycloud.PORT = 8053;

Dummycloud.prototype.handleMessage = function(msg) {
    // some default handling.
    switch (msg.method) {
        case "_otc.info":
            this.miioSocket.sendMessage({
                "id": msg.id,
                "result": {
                    "otc_list": [{"ip": this.spoofedIP, "port": Dummycloud.PORT}],
                    "otc_test": {
                        "list": [{"ip": this.spoofedIP, "port": Dummycloud.PORT}],
                        "interval": 1800,
                        "firsttest": 1193
                    }
                }
            });
            return;
    }
    if (!this.onMessage(msg)) {
        Logger.info("Unknown cloud message received:", JSON.stringify(msg));
    }
};

/**
 * Shutdown Dummycloud
 * @returns {Promise<void>}
 */
Dummycloud.prototype.shutdown = function() {
    return this.miioSocket.shutdown();
};

module.exports = Dummycloud;