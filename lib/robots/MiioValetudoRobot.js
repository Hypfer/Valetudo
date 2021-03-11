const dgram = require("dgram");
const express = require("express");
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");

const ValetudoRobot = require("../core/ValetudoRobot");
const MiioSocket = require("../miio/MiioSocket");
const RetryWrapper = require("../miio/RetryWrapper");
const Dummycloud = require("../miio/Dummycloud");
const Logger = require("../Logger");
const NotImplementedError = require("../core/NotImplementedError");

class MiioValetudoRobot extends ValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../Configuration")} options.config
     */
    constructor(options) {
        super(options);

        this.setEmbeddedParameters();

        this.robotConfig = this.config.get("robot");
        this.implConfig = (this.robotConfig && this.robotConfig.implementationSpecificConfig) || {};

        this.ip = this.implConfig.ip || "127.0.0.1";
        this.embeddedDummycloudIp = this.implConfig["dummycloudIp"] || "127.0.0.1";
        this.dummycloudBindIp = this.implConfig["dummycloudBindIp"] || (
            this.config.get("embedded") ? "127.0.0.1" : "0.0.0.0");

        this.mapUploadUrlPrefix = this.implConfig.mapUploadUrlPrefix || (
            "http://" + this.embeddedDummycloudIp + ":8079");

        this.localSocket = new RetryWrapper(
            (() => {
                const socket = dgram.createSocket("udp4");
                socket.bind();

                return new MiioSocket({
                    socket: socket,
                    token: this.localSecret,
                    onMessage: () => {},
                    deviceId: undefined,
                    rinfo: {address: this.ip, port: MiioSocket.PORT},
                    timeout: undefined,
                    onConnected: undefined,
                    name: "local",
                    isServerSocket: false
                });
            })(),
            () => {
                return this.localSecret;
            }
        );

        this.dummyCloud = new Dummycloud({
            spoofedIP: this.embeddedDummycloudIp,
            cloudSecret: this.cloudSecret,
            deviceId: this.deviceId,
            bindIP: this.dummycloudBindIp,
            onConnected: () => this.onCloudConnected(),
            onMessage: msg => this.onMessage(msg)
        });

        this.mapUploadInProgress = false;
        this.expressApp = express();

        this.mapUploadServer = http.createServer(this.expressApp);

        this.expressApp.put("/api/miio/map_upload_handler", (req, res) => {
            Logger.debug("map_upload_handler", req.query);

            if (!this.mapUploadInProgress) {
                this.mapUploadInProgress = true;

                var data = [];
                req.on("data", chunk => data.push(chunk));

                req.on("end", () => {
                    const uploadedRawMapData = Buffer.concat(data);

                    this.preprocessMap(uploadedRawMapData).then(data => {
                        const parsedMap = this.parseMap(data);

                        if (parsedMap) {
                            this.emitMapUpdated();
                        } else {
                            Logger.warn("Failed to parse uploaded map");
                        }
                    })
                        .finally(() => {
                            this.mapUploadInProgress = false;
                        });

                    res.sendStatus(200);
                });
            } else {
                //This prevents valetudo from leaking memory
                res.end();
                req.connection.destroy();
            }
        });

        this.mapUploadServer.listen(8079, this.dummycloudBindIp, function() {
            Logger.info("Map Upload Server running on port " + 8079);
        });
    }

    get deviceId() {
        let deviceId = this.implConfig.deviceId;

        if (!deviceId) {
            deviceId = MiioValetudoRobot.READ_DEVICE_CONF(this.deviceConfPath)["did"];
        }

        return deviceId ? parseInt(deviceId, 10) : 0;
    }

    get localSecret() {
        let localSecret = this.implConfig.localSecret;

        if (!localSecret) {
            Logger.trace("Trying to read token file at " + this.tokenFilePath);
            try {
                localSecret = fs.readFileSync(this.tokenFilePath);
            } catch (e) {
                Logger.debug("Cannot read token file at", this.tokenFilePath, "Local communication will fail", e);
                return Buffer.alloc(16);
            }
        } else {
            Logger.trace("Parsing localSecret from config");
        }

        if (localSecret && localSecret.length >= 32) {
            // For local development, people might put in the hex representation of the token.
            // Make this work too.
            return Buffer.from(localSecret.toString().slice(0, 32), "hex");
        }

        if (localSecret && localSecret.length >= 16) {
            return Buffer.from(localSecret.toString().slice(0, 16));
        }

        Logger.debug("Invalid localSecret with length " + localSecret.length);
        return Buffer.alloc(16);
    }

    get cloudSecret() {
        let cloudSecret = this.implConfig.cloudSecret;

        if (!cloudSecret) {
            cloudSecret = MiioValetudoRobot.READ_DEVICE_CONF(this.deviceConfPath)["key"];
        }

        if (cloudSecret && cloudSecret.length >= 32) {
            // For local development, people might put in the hex representation of the token.
            // Make this work too.
            return Buffer.from(cloudSecret.toString().slice(0, 32), "hex");
        }

        return Buffer.from(
            cloudSecret ? cloudSecret : "0000000000000000" // This doesnt work but it wont crash the system
        );
    }

    setEmbeddedParameters() {
        this.deviceConfPath = "/dev/null";
        this.tokenFilePath = "/dev/null";
    }

    // clang-format off
    /*
    Handles http_dns load balancing requests.

    Example request and response (the latter is pretty-printed for readability).

    GET /gslb?tver=2&id=277962183&dm=ot.io.mi.com&timestamp=1574455630&sign=nNevMcHtzuB90okJfG9zSyPTw87u8U8HQpVNXqpVt%2Bk%3D HTTP/1.1
    Host:110.43.0.83
    User-Agent:miio-client

    {
        "info": {
            "host_list": [{
                    "ip": "120.92.65.244",
                    "port": 8053
                }, {
                    "ip": "120.92.142.94",
                    "port": 8053
                }, {
                    "ip": "58.83.177.237",
                    "port": 8053
                }, {
                    "ip": "58.83.177.239",
                    "port": 8053
                }, {
                    "ip": "58.83.177.236",
                    "port": 8053
                }, {
                    "ip": "120.92.65.242",
                    "port": 8053
                }
            ],
            "enable": 1
        },
        "sign": "NxPNmsa8eh2/Y6OdJKoEaEonR6Lvrw5CkV5+mnpZois=",
        "timestamp": "1574455630"
    }
    */
    // clang-format on
    handleHttpDnsRequest(req, res) {
        // ot.io.mi.com asks for UDP host
        // ott.io.mi.com asks for TCP hosts, which our dummycloud doesn’t (yet) support.
        if (req.query["dm"] === "ott.io.mi.com") {
            res.status(501).send("miio/tcp not implemented");
        }
        const info = {
            "host_list": [
                {
                    "ip": this.embeddedDummycloudIp,
                    "port": 8053
                }
            ],
            "enable": 1
        };
        const signature = crypto.createHmac("sha256", this.cloudSecret)
            .update(JSON.stringify(info))
            .digest("base64");

        res.status(200).send({
            "info": info,
            "timestamp": req.query["timestamp"],
            "sign": signature
        });
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
        if (this.dummyCloud.miioSocket.connected) {
            return this.sendCloud({"method": method, "params": args}, options);
        } else {
            return this.localSocket.sendMessage(method, args, options);
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
        return this.dummyCloud.miioSocket.sendMessage(msg, options);
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
     * @returns {import("../entities/map/ValetudoMap")}
     */
    parseMap(data) {
        throw new NotImplementedError();
    }


    startup() {
        Logger.info("DeviceId " + this.deviceId);
        Logger.info("IP " + this.ip);
        Logger.info("CloudSecret " + this.cloudSecret);
        Logger.info("LocalSecret " + this.localSecret);
    }


    static READ_DEVICE_CONF(path) {
        let deviceConf;

        Logger.trace("Trying to open device.conf at " + path);
        try {
            deviceConf = fs.readFileSync(path);
        } catch (e) {
            //This is intentionally failing if we're the wrong implementation
            Logger.trace("cannot read", path, e);
        }

        let result = {};

        if (deviceConf) {
            deviceConf.toString().split(/\n/).map(line => line.split(/=/, 2)).map(([k, v]) => result[k] = v);
        }

        if (!result["did"] || !result["key"] || !result["model"]) {
            Logger.trace("Failed to read device.conf");
            return null;
        }

        return result;
    }

}

module.exports = MiioValetudoRobot;
