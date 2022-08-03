const crypto = require("crypto");
const dgram = require("dgram");
const express = require("express");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const Semaphore = require("semaphore");

const Dummycloud = require("../miio/Dummycloud");
const Logger = require("../Logger");
const MiioSocket = require("../miio/MiioSocket");
const NotImplementedError = require("../core/NotImplementedError");
const RetryWrapper = require("../miio/RetryWrapper");
const Tools = require("../utils/Tools");
const ValetudoRobot = require("../core/ValetudoRobot");

const entities = require("../entities");
const stateAttrs = entities.state.attributes;

class MiioValetudoRobot extends ValetudoRobot {
    /**
     *
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("../ValetudoEventStore")} options.valetudoEventStore
     */
    constructor(options) {
        super(options);

        this.setEmbeddedParameters();

        this.robotConfig = this.config.get("robot");
        this.implConfig = (this.robotConfig && this.robotConfig.implementationSpecificConfig) ?? {};

        this.ip = this.implConfig.ip ?? "127.0.0.1";
        this.embeddedDummycloudIp = this.implConfig["dummycloudIp"] ?? "127.0.0.1";
        this.dummycloudBindIp = this.implConfig["dummycloudBindIp"] ?? (this.config.get("embedded") ? "127.0.0.1" : "0.0.0.0");

        this.mapUploadUrlPrefix = this.implConfig.mapUploadUrlPrefix ?? ("http://" + this.embeddedDummycloudIp + ":8079");

        this.localSocket = new RetryWrapper(
            (() => {
                const socket = dgram.createSocket("udp4");
                socket.bind();

                return new MiioSocket({
                    socket: socket,
                    token: this.localSecret,
                    deviceId: undefined,
                    rinfo: {address: this.ip, port: MiioSocket.PORT},
                    timeout: undefined,
                    name: "local",
                    isCloudSocket: false
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
            onConnected: () => {
                return this.onCloudConnected();
            },
            onIncomingCloudMessage: msg => {
                return this.onIncomingCloudMessage(msg);
            }
        });

        this.fdsUploadSemaphore = Semaphore(2);
        this.mapPollingIntervals = {
            default: 60,
            active: this.config.get("embedded") === true && Tools.IS_LOWMEM_HOST() ? 4 : 2,
            error: 30
        };
        this.mapPollMutex = Semaphore(1);
        this.mapPollTimeout = undefined;
        this.expressApp = express();

        this.fdsMockServer = http.createServer(this.expressApp);

        this.expressApp.put("/api/miio/fds_upload_handler/:filename?", (req, res) => {
            Logger.debug("FDS upload started with:", {
                query: req.query,
                params: req.params
            });

            this.fdsUploadSemaphore.take(() => {
                const expectedSize = parseInt(req.header("content-length"));
                let finished = false;

                if (expectedSize < MAX_UPLOAD_FILESIZE) {
                    let uploadTimeout = setTimeout(() => {
                        finished = true;

                        res.end();
                        req.socket?.destroy();

                        Logger.warn("FDS upload timeout", {
                            query: req.query,
                            params: req.params
                        });
                        this.fdsUploadSemaphore.leave();
                    }, 3000);


                    const uploadBuffer = Buffer.allocUnsafe(expectedSize);
                    let offset = 0;

                    req.on("data", chunk => {
                        /*
                            We don't need a range check here, because even if content-length is shorter than
                            what is actually uploaded, trying to write outside a buffer like we do here
                            just fails silently without any breakage. Thanks javascript
                         */
                        for (let i = 0; i < chunk.length; i++) {
                            uploadBuffer[offset] = chunk[i];
                            offset++;
                        }
                    });

                    req.on("end", () => {
                        clearTimeout(uploadTimeout);

                        if (this.config.get("debug").storeRawFDSUploads === true) {
                            try {
                                const location = path.join(os.tmpdir(), "raw_upload_" + new Date().getTime());
                                fs.writeFileSync(location, uploadBuffer);

                                Logger.info("Wrote uploaded raw file to " + location);
                            } catch (e) {
                                Logger.warn("Failed to store raw file.", e);
                            }
                        }

                        this.handleUploadedFDSData(
                            uploadBuffer,
                            req.query,
                            req.params
                        ).catch(err => {
                            Logger.warn("Error while handling uploaded map data", {
                                query: req.query,
                                params: req.params,
                                error: err
                            });
                        }).finally(() => {
                            if (finished !== true) {
                                res.sendStatus(200);
                                this.fdsUploadSemaphore.leave();
                            }
                        });
                    });
                } else {
                    Logger.warn(`Received FDSMock upload request with a content-length of ${expectedSize}. Aborting.`);

                    res.end();
                    req.socket?.destroy();
                    this.fdsUploadSemaphore.leave();
                }
            });
        });

        this.fdsMockServer.on("error", (e) => {
            Logger.error("FDSMockServer Error: ",e);
        });

        this.fdsMockServer.listen(8079, this.dummycloudBindIp, function() {
            Logger.info("FDSMockServer running on port " + 8079);
        });
    }

    get deviceId() {
        let deviceId = this.implConfig.deviceId;

        if (this.cachedDeviceId) {
            return this.cachedDeviceId;
        }

        if (!deviceId && this.config.get("embedded") === true) {
            deviceId = MiioValetudoRobot.READ_DEVICE_CONF(this.deviceConfPath)["did"];
        }

        if (deviceId) {
            deviceId = parseInt(deviceId, 10);
            this.cachedDeviceId = deviceId;
        } else {
            deviceId = 0;
        }

        return deviceId;
    }

    get localSecret() {
        let localSecret = this.implConfig.localSecret;

        if (!localSecret && this.config.get("embedded") === true) {
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

        Logger.debug("Invalid localSecret with length " + (localSecret && localSecret.length ? localSecret.length : 0));
        return Buffer.alloc(16);
    }

    get cloudSecret() {
        let cloudSecret = this.implConfig.cloudSecret;

        if (this.cachedCloudSecret) {
            return this.cachedCloudSecret;
        }

        if (!cloudSecret && this.config.get("embedded") === true) {
            cloudSecret = MiioValetudoRobot.READ_DEVICE_CONF(this.deviceConfPath)["key"];
        }

        if (cloudSecret && cloudSecret.length >= 32) {
            // For local development, people might put in the hex representation of the token.
            // Make this work too.
            cloudSecret = Buffer.from(cloudSecret.toString().slice(0, 32), "hex");
        }

        if (cloudSecret) {
            this.cachedCloudSecret = cloudSecret;

            return cloudSecret;
        } else {
            return Buffer.from("0000000000000000"); // This doesnt work but it wont crash the system
        }
    }

    setEmbeddedParameters() {
        this.deviceConfPath = "/dev/null";
        this.tokenFilePath = "/dev/null";
    }

    initModelSpecificWebserverRoutes(app) {
        super.initModelSpecificWebserverRoutes(app);

        /*
        Handles http_dns load balancing requests.
        To properly spoof the http_dns request, we need to have this route on port 80 instead of the
        miio-implementation specific second webserver on 8079

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
        app.get("/gslb", (req, res) => {
            // ot.io.mi.com asks for UDP host
            // ott.io.mi.com asks for TCP hosts, which our dummycloud doesn’t (yet) support.
            if (req.query["dm"] === "ott.io.mi.com") {
                res.status(501).send("miio/tcp not implemented");
                return;
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

            res.json({
                "info": info,
                "timestamp": req.query["timestamp"],
                "sign": signature
            });
        });
    }

    /**
     * @public
     */
    emitStateUpdated() {
        super.emitStateUpdated();
    }

    /**
     * @public
     */
    emitStateAttributesUpdated() {
        super.emitStateAttributesUpdated();
    }

    /**
     * @public
     */
    emitMapUpdated() {
        super.emitMapUpdated();
    }

    /**
     * Sends a {'method': method, 'params': args} message to the robot.
     * Uses the cloud socket if available or falls back to the local one.
     *
     * @public
     * @param {string} method
     * @param {object|Array} args
     * @param {object} options
     * @param {number=} options.retries
     * @param {number=} options.timeout custom timeout in milliseconds
     * @param {boolean=} options.preferLocalInterface
     * @returns {Promise<object>}
     */
    sendCommand(method, args = [], options = {}) {
        if (this.dummyCloud.miioSocket.connected && options.preferLocalInterface !== true) {
            return this.sendCloud({"method": method, "params": args}, options);
        } else {
            return this.localSocket.sendMessage({"method": method, "params": args}, options);
        }
    }

    /**
     * Sends a json object to cloud socket.
     *
     * @public
     * @param {object} msg JSON object to send.
     * @param {object} options
     * @param {number=} options.timeout custom timeout in milliseconds
     * @returns {Promise<object>}
     */
    sendCloud(msg, options = {}) {
        return this.dummyCloud.miioSocket.sendMessage(msg, options);
    }

    /**
     *
     * @protected
     * @param {any} msg the json object sent by the remote device
     * @returns {boolean} True if the message was handled.
     */
    onIncomingCloudMessage(msg) {
        switch (msg.method) {
            case "_sync.gen_tmp_presigned_url":
            case "_sync.gen_presigned_url":
            case "_sync.batch_gen_room_up_url": {
                const key = msg.params?.suffix ?? "urls";
                const indices = msg.params?.indexes ?? [0, 1, 2, 3];

                let result = {ok: true};

                const expires = Math.floor(new Date(new Date().getTime() + 15 * 60000).getTime() / 1000); //+15min;
                let url = `${this.mapUploadUrlPrefix}/api/miio/fds_upload_handler?ts=${process.hrtime().toString().replace(/,/g, "")}&suffix=${key}&Expires=${expires}`;

                if (msg.method === "_sync.gen_tmp_presigned_url") {
                    result[key] = indices.map(i => {
                        return {
                            url: url + "&index=" + i + "&method=" + msg.method,
                            obj_name: process.hrtime().toString().replace(/,/g, "") + "/" + i,
                            method: "PUT",
                            expires_time: expires
                        };
                    });
                } else if (msg.method === "_sync.gen_presigned_url") {
                    result[key] = {
                        url: url + "&method=" + msg.method,
                        ok: true,
                        expires_time: expires,
                        obj_name: process.hrtime().toString().replace(/,/g, ""),
                        method: "PUT",
                        pwd: "helloworld"
                    };
                } else if (msg.method === "_sync.batch_gen_room_up_url") {
                    result = indices.map(i => {
                        return (url + "&index=" + i + "&method=" + msg.method);
                    });
                }

                this.sendCloud({id: msg.id, result: result}).catch((reason => {
                    Logger.error("Failed to send map request response:", reason);
                }));

                return true;
            }
        }
        return false;
    }

    /**
     * Called once the dummycloud connection was established.
     *
     * @protected
     */
    onCloudConnected() {
        Logger.info("Dummycloud connected");
        // start polling the map after a brief delay of 3.5s
        setTimeout(() => {
            return this.pollMap();
        }, 3500);
    }

    /**
     * @public
     * @returns {void}
     */
    pollMap() {
        this.mapPollMutex.take(() => {
            let repollSeconds = this.mapPollingIntervals.default;

            // Clear pending timeout, since we’re starting a new poll right now.
            if (this.mapPollTimeout) {
                clearTimeout(this.mapPollTimeout);

                this.mapPollTimeout = undefined;
            }

            this.executeMapPoll().then((response) => {
                repollSeconds = this.determineNextMapPollInterval(response);
            }).catch(() => {
                repollSeconds = this.mapPollingIntervals.error;
            }).finally(() => {
                this.mapPollTimeout = setTimeout(() => {
                    this.pollMap();
                }, repollSeconds * 1000);

                this.mapPollMutex.leave();
            });
        });
    }

    /**
     *
     * @protected
     * @abstract
     * @returns {Promise<any>}
     */
    async executeMapPoll() {
        throw new NotImplementedError();
    }

    /**
     * @protected
     * @param {any} pollResponse Implementation specific
     * @return {number} seconds
     */
    determineNextMapPollInterval(pollResponse) {
        let repollSeconds = this.mapPollingIntervals.default;

        let StatusStateAttribute = this.state.getFirstMatchingAttribute({
            attributeClass: stateAttrs.StatusStateAttribute.name
        });

        if (StatusStateAttribute && StatusStateAttribute.isActiveState) {
            repollSeconds = this.mapPollingIntervals.active;
        }

        return repollSeconds;
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
     * Parse the preprocessed map data and store it in this.state.map if it's successful
     *
     * @public
     * @abstract
     * @param {Buffer} data
     * @returns {Promise<import("../entities/map/ValetudoMap")|null>}
     */
    async parseMap(data) {
        throw new NotImplementedError();
    }

    /**
     * @public
     * @param {Buffer} data
     * @param {object} query implementation specific query parameters
     * @param {object} params implementation specific url parameters
     * @returns {Promise<void>}
     */
    async handleUploadedFDSData(data, query, params) {
        // By-default we assume that everything uploaded will be a map
        this.preprocessMap(data).then(async (preprocessedData) => {
            const parsedMap = await this.parseMap(preprocessedData);

            if (!parsedMap) {
                Logger.warn("Failed to parse uploaded map");
            }
        });
    }


    startup() {
        Logger.info("DeviceId " + this.deviceId);
        Logger.info("IP " + this.ip);
        Logger.info("CloudSecret " + this.cloudSecret);
        Logger.info("LocalSecret " + this.localSecret);
    }

    async shutdown() {
        await super.shutdown();
        await this.dummyCloud.shutdown();
        await this.localSocket.shutdown();
    }

    static READ_DEVICE_CONF(pathOnDisk) {
        let deviceConf;

        Logger.trace("Trying to open device.conf at " + pathOnDisk);
        try {
            deviceConf = fs.readFileSync(pathOnDisk);
        } catch (e) {
            //This is intentionally failing if we're the wrong implementation
            Logger.trace("cannot read", pathOnDisk, e);
        }

        let result = {};

        if (deviceConf) {
            deviceConf.toString().split(/\n/).forEach(line => {
                const match = DEVICE_CONF_KEY_VALUE_REGEX.exec(line);

                if (match && match.groups) {
                    result[match.groups.key] = match.groups.value;
                }
            });
        }

        if (!result["did"] || !result["key"] || !result["model"]) {
            Logger.trace("Missing or invalid device.conf");
            return null;
        }

        return result;
    }
}

const DEVICE_CONF_KEY_VALUE_REGEX = /^(?<key>[A-Za-z\d:.]+)=(?<value>[A-Za-z\d:.]+)$/;
const MAX_UPLOAD_FILESIZE = 4 * 1024 * 1024; // 4 MiB

module.exports = MiioValetudoRobot;
