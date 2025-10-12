const crypto = require("crypto");
const express = require("express");
const https = require("https");
const Logger = require("../Logger");
const MSmartPacket = require("./MSmartPacket");
const MSmartTimeoutError = require("./MSmartTimeoutError");
const Semaphore = require("semaphore");
const tls = require("tls");
const {createBroker} = require("aedes");

// For this to work in all situations, we need to patch out the forced timesync within the firmware,
// as otherwise it will never start up if access to the hardcoded NTP servers in the FW is blocked
// J15PU FW 490 also added an additional check that pings either google or baidu and refuses to start up otherwise
// That too needs to be patched out

class MSmartDummycloud {
    /**
     * @param {object} options
     * @param {import("../utils/DummyCloudCertManager")} options.dummyCloudCertManager
     * @param {string} options.bindIP
     * @param {number=} options.timeout timeout in milliseconds to wait for a response
     * @param {(packet: import("./MSmartPacket")) => boolean} options.onIncomingCloudMessage
     * @param {string} options.dummyClientCert
     * @param {string} options.dummyClientKey
     * @param {() => void} options.onConnected
     * @param {(req: any, res: any) => boolean} options.onHttpRequest
     * @param {(type: string, data: any) => void} options.onUpload - TODO naming
     * @param {(type: string, value: any) => void} options.onEvent - TODO naming
     */
    constructor(options) {
        this.dummyCloudCertManager = options.dummyCloudCertManager;
        this.bindIP = options.bindIP;
        this.timeout = options.timeout ?? 5000;
        this.onConnected = options.onConnected;
        this.onIncomingCloudMessage = options.onIncomingCloudMessage;
        this.onHttpRequest = options.onHttpRequest;
        this.onUpload = options.onUpload;
        this.onEvent = options.onEvent;
        this.dummyClientCert = options.dummyClientCert;
        this.dummyClientKey = options.dummyClientKey;

        this.sendCommandMutex = Semaphore(1);

        this.mqttBroker = createBroker();
        this.mqttServer = tls.createServer({
            SNICallback: (hostname, callback) => {
                const { key, cert } = this.dummyCloudCertManager.getCertificate(hostname);
                callback(null, tls.createSecureContext({ key: key, cert: cert }));
            }
        });
        this.httpServer = https.createServer({
            SNICallback: (hostname, callback) => {
                const { key, cert } = this.dummyCloudCertManager.getCertificate(hostname);
                callback(null, tls.createSecureContext({ key: key, cert: cert }));
            }
        });

        this.commandTopic = "device/unknown/down";
        this.aiCommandTopic = "ai/unknown/down";
        this.mapCommandTopic = "map/unknown/down";

        /**
         * @type {Object.<string, {
         *          timeout_id?: NodeJS.Timeout,
         *          onTimeoutCallback: () => void,
         *          resolve: (result: any) => void,
         *          reject: (err: any) => void,
         *          command: string
         *      }>}
         */
        this.pendingRequests = {};

        this.setupMQTT();
        this.setupHTTP();
    }

    setupMQTT() {
        this.mqttServer = tls.createServer({
            SNICallback: (hostname, callback) => {
                const { key, cert } = this.dummyCloudCertManager.getCertificate(hostname);
                callback(null, tls.createSecureContext({ key: key, cert: cert }));
            }
        }, this.mqttBroker.handle);

        this.mqttServer.listen(MSmartDummycloud.MQTT_PORT, this.bindIP, () => {
            Logger.info(`MSmartDummycloud MQTT listening on ${this.bindIP}:${MSmartDummycloud.MQTT_PORT}`);
        });

        this.mqttServer.on("error", (err) => {
            Logger.error("MSmartDummycloud MQTT Server Error:", err);
        });

        this.mqttBroker.on("client", (client) => {
            Logger.info(`MSmartDummycloud MQTT client connected: ${client.id}`);

            this.onConnected();
        });

        this.mqttBroker.on("subscribe", (subscriptions) => {
            Logger.debug("Subscriptions", subscriptions);

            subscriptions.forEach(subscription => {
                if (subscription.topic.endsWith("/down")) {
                    if (subscription.topic.startsWith("device/")) {
                        this.commandTopic = subscription.topic;

                        Logger.debug(`MSmartDummycloud device command topic: ${this.commandTopic}`);
                    } else if (subscription.topic.startsWith("ai/")) {
                        this.aiCommandTopic = subscription.topic;

                        Logger.debug(`MSmartDummycloud AI command topic: ${this.aiCommandTopic}`);
                    } else if (subscription.topic.startsWith("map/")) { // J12 (and older?)
                        this.mapCommandTopic = subscription.topic;

                        Logger.debug(`MSmartDummycloud map command topic: ${this.mapCommandTopic}`);
                    }
                }
            });
        });

        this.mqttBroker.on("clientDisconnect", (client) => {
            Logger.info(`MSmartDummycloud MQTT client disconnected: ${client.id}`);
        });

        this.mqttBroker.on("publish", async (packet, client) => {
            if (!client) {
                return; // messages without client are outgoing
            }

            Logger.trace(`MSmartDummycloud MQTT Message on '${packet.topic}':`, packet.payload.toString());

            try {
                const message = JSON.parse(packet.payload.toString());
                this.handleIncomingCloudMessage({topic: packet.topic, payload: message});
            } catch (e) {
                Logger.warn("MSmartDummycloud failed to parse incoming message", e);
            }
        });
    }

    setupHTTP() {
        const app = express();
        app.use(express.json());

        app.post("/acl/device/register", (req, res) => {
            const incomingHostname = req.hostname;
            Logger.info(`Handling provisioning request for hostname: ${incomingHostname}. ${JSON.stringify(req.body, null, 2)}`);

            const responsePayload = {
                "errorCode": "0",
                "msg": "success",
                "reason": "success",
                "data": {
                    "deviceId": req.body.uuid,
                    "uuid": req.body.uuid,
                    "productId": req.body.productId,
                    "mac": req.body.mac,
                    "sn": req.body.sn,
                    "ip": req.ip,
                    "key": "MOCK_DEVICE_KEY_" + Date.now(),
                    "bindToken": "MOCK_BIND_TOKEN_" + Date.now(),
                    "mqttInfo": {
                        "clientId": req.body.uuid,
                        "serverAddress": incomingHostname,
                        "port": MSmartDummycloud.MQTT_PORT,
                        "authType": 1,
                        "certificatePem": this.dummyClientCert,
                        "publicKey": this.dummyClientCert,
                        "privateKey": this.dummyClientKey
                    },
                    "extra": {
                        "mapHost": `http://${incomingHostname}`,
                        "odmServiceHost": `https://${incomingHostname}`,
                        "otaHost": `http://${incomingHostname}`,
                        "logHost": `http://${incomingHostname}`,
                        "voiceHost": `http://${incomingHostname}`,
                        "videoHost": `https://${incomingHostname}`
                    }
                }
            };

            Logger.info("Constructed Response Payload:", JSON.stringify(responsePayload, null, 2));
            res.status(200).json(responsePayload);
        });

        app.get("/m7-server/actuator/health/ping", (req, res) => {
            Logger.trace("Handling /m7-server/actuator/health/ping");
            res.status(200).json({"status": "UP"});
        });

        app.get("/", (req, res, next) => {
            if (req.hostname.endsWith("ipify.org") || req.hostname.endsWith("ipify.cn")) {
                Logger.info(`Handling IP lookup request for ${req.hostname}.`);

                res.status(200).send(req.ip);
            } else {
                next();
            }
        });

        app.post("/v1/dev2pro/m7/map/part/get", (req, res) => {
            Logger.debug(`Handling part get for: ${req.body.mapPart}`);
            Logger.debug(req.body);

            res.status(200).json({ "data": {} });
        });

        app.post("/v1/dev2pro/m7/map/list/:part", (req, res) => {
            if (req.body) {
                Logger.trace(`${req.url}: `, JSON.stringify(req.body, null, 2));

                this.onUpload(req.params.part, req.body.data); //TODO: perhaps validate types
            }


            res.status(200).send();
        });

        app.post("/v1/dev2pro/m7/map/list/mop/:part", (req, res) => {
            if (req.body) {
                Logger.trace(`${req.url}: `, JSON.stringify(req.body, null, 2));

                this.onUpload(`mop_${req.params.part}`, req.body.data); //TODO: perhaps validate types
            }


            res.status(200).send();
        });

        app.post("/v1/dev2pro/m7/map/part/upload", (req, res) => {
            if (req.body) {
                Logger.trace(`${req.url}: `, JSON.stringify(req.body, null, 2));

                this.onUpload(req.body.mapPart, req.body.data);
            }

            res.status(200).send();
        });

        app.post("/v1/dev2pro/cruise/list/points", (req, res) => {
            if (req.body) {
                Logger.trace(`${req.url}: `, JSON.stringify(req.body, null, 2));

                this.onUpload("points", req.body.data);
            }


            res.status(200).send();
        });

        app.post("/v1/dev2pro/m7/work/status/upload", (req, res) => {
            Logger.debug("Received a historical record for a finished or aborted cleanup.");

            res.status(200).json({ msg: "OK", code: "0" });
        });

        /*
            This is used to ask the cloud for a URL to a voice pack by id
            I think it also regularly checks for updates to voicepacks? Not sure.
            
            Reference reply for request
            {
              "sn8": "750Y000R",
              "id": "561",
              "md5": "958386132015a99f300ee9a372273b4a"
            }

            {
                "code": "0",
                "data": "https://<cdn_url>/m7-voice-full/750Y000R-561-18-<somestring>.zip",
                "md5": "052e67dd8843cdfc8f89fc130ea21db5",
                "msg": "OK",
                "nonce": "<nonce>",
                "voiceId": "1198"
            }
         */

        app.post("/v1/dev2pro/m7/voice/check", (req, res) => {
            Logger.debug(`Handling request for Voice with ID '${req.body.id}'`);

            res.status(200).json({
                "code": "0",
                "data": "",
                "md5": "",
                "msg": "OK",
                "nonce": req.headers["nonce"] ?? "",
                "voiceId": ""
            });
        });


        /*
            Always respond with "no update available".
            For reference, example reply for an available update:
            
            {
               "code":"0",
               "msg":"OK",
               "nonce":"<nonce>",
               "data":{
                  "id":91,
                  "sn8":"750Y000R",
                  "moduleBranchCode":63,
                  "type":0,
                  "name":"V2.0.0.20240927_rc",
                  "md5":"9478bb7890c6cef753e484804c117e26",
                  "url":"https://<cdn_url>/<filename>.zip",
                  "size":32044516,
                  "version":2,
                  "minModuleVersion":240,
                  "maxModuleVersion":9999,
                  "releaseMode":0,
                  "whitelistDeviceIds":[
                     
                  ],
                  "historicalVersions":[
                     
                  ],
                  "lastOperator":"lixin224",
                  "updateTime":"2025-05-23 19:25:48"
               }
            }
         */
        app.post("/package-management/v1/dev2pro/check", (req, res) => {
            Logger.debug(`Handling AI Model update check. Currently installed version: '${req.body.packageVersion}'`);

            res.status(200).json({
                "code": "0",
                "msg": "OK",
                "nonce": req.headers["nonce"] ?? "",
                "data": null
            });
        });

        app.post("/v1/ota/version/check", (req, res) => {
            const requestedModule = req.body.isModule || "0";
            Logger.debug(`Handling OTA check for module type: ${requestedModule}`);

            const responsePayload = {
                "errorCode": "0",
                "msg": "success",
                "reason": "success",
                "data": {
                    "isModule": requestedModule,
                    "hasNew": "0",
                    "md5": "",
                    "productName": "",
                    "sn8": "",
                    "url": "",
                    "version": "",
                    "forceUpdate": "",
                    "fwSign": "",
                    "sh256": "",
                    "rsaSign": ""
                }
            };

            res.status(200).json(responsePayload);
        });

        app.post("/v1/ota/status/update", (req, res) => {
            Logger.debug("Handling OTA status update request.");
            if (req.body) {
                Logger.debug("OTA Status Update Body:", JSON.stringify(req.body, null, 2));
            }

            res.status(200).json({ msg: "OK", code: "0" });
        });

        app.post("/logService/v1/dev/event-tracking", (req, res) => {
            if (req.body) {
                Logger.trace(`${req.url}: `, JSON.stringify(req.body, null, 2));

                this.onEvent(req.body.type, req.body.value);
            }

            res.status(200).send();
        });

        app.post("/v3/dev2pro/login", (req, res) => {
            Logger.debug("Received login request");
            if (req.body) {
                Logger.debug("Body:", JSON.stringify(req.body, null, 2));
            }

            res.status(200).json({ data: "i-am-not-a-token" });
        });

        app.post("/v3/dev2pro/ability", (req, res) => {
            Logger.debug("Received ability request");
            if (req.body) {
                Logger.debug("Body:", JSON.stringify(req.body, null, 2));
            }

            res.status(200).json({
                data: {
                    videoImageEnc: false
                    // There could be more in this. So far, I just found the single key and didn't check what the cloud actually sends
                    // TBD: is false the correct thing to set here?
                }
            });
        });

        /*
            This seems to be used by the firmware to pull a temporary AES encryption key on boot to.. maybe encrypt pictures with?
            The response itself, even though sent via HTTPS, is a json containing base64, which is the requested key + IV AES encrypted with a static one
            
            Persistent might mean image uploads perhaps? Compared with its RTC sibling
         */
        app.post("/v3/dev2pro/enc/persistent/key", (req, res) => {
            Logger.debug("Handling persistent key request");

            const transportKey = "Midea@api-device";
            const algorithm = "aes-128-cbc";

            // 16-byte key + 16-byte IV
            const plaintextPayload = Buffer.alloc(32, 0);

            const transportIv = Buffer.alloc(16, 0);
            const cipher = crypto.createCipheriv(algorithm, transportKey, transportIv);
            const encryptedPayload = Buffer.concat([cipher.update(plaintextPayload), cipher.final()]);

            res.status(200).json({
                code: "0",
                msg: "success",
                requestId: transportIv.toString("hex"),
                data: encryptedPayload.toString("base64"),
            });
        });


        // FIXME: this is a duplicate of the persistent route.
        //        I am just guessing that this might be the correct response as well
        // TODO: check internal logs of the firmware and see if anything complains
        app.post("/v3/dev2pro/enc/rtc/key", (req, res) => {
            Logger.debug("Handling rtc key request");

            Logger.debug("Handling persistent key request");

            const transportKey = "Midea@api-device";
            const algorithm = "aes-128-cbc";

            // 16-byte key + 16-byte IV
            const plaintextPayload = Buffer.alloc(32, 0);

            const transportIv = Buffer.alloc(16, 0);
            const cipher = crypto.createCipheriv(algorithm, transportKey, transportIv);
            const encryptedPayload = Buffer.concat([cipher.update(plaintextPayload), cipher.final()]);

            res.status(200).json({
                code: "0",
                msg: "success",
                requestId: transportIv.toString("hex"),
                data: encryptedPayload.toString("base64"),
            });
        });

        // This route receives events that might be protobufs(?) as multipart/form-data. They do seem debug-only? Not sure.
        // Let's see if we can get away without _actually_ handling them
        app.post("/v3/dev2pro/robot/event", (req, res) => {
            res.status(200).send();
        });

        app.post("/v1/biz/file/device/uploadFileUrl", (req, res) => {
            Logger.trace("Received request for a new presigned file upload URL");

            res.status(200).json({
                code: "0",
                msg: "OK",
                data: {
                    url: `https://${req.hostname}/_valetudo/fileUpload?ts=${Date.now()}`
                }
            });
        });

        app.put("/_valetudo/fileUpload", (req, res) => {
            Logger.trace("Received file upload");

            res.status(200).send();
        });


        app.all("*", (req, res) => {
            if (this.onHttpRequest) {
                const handled = this.onHttpRequest(req, res);
                if (handled) {
                    return;
                }
            }

            Logger.info("Unhandled MSmartDummycloud HTTP Request", {
                protocol: req.secure ? "HTTPS" : "HTTP",
                host: req.headers.host,
                method: req.method,
                path: req.path,
                headers: req.headers,
                body: req.body ?? null
            });

            res.status(200).json({ msg: "OK", code: "0" });
        });

        this.httpServer.on("request", app);

        this.httpServer.listen(MSmartDummycloud.HTTP_PORT, this.bindIP, () => {
            Logger.info(`MSmartDummycloud HTTPS listening on ${this.bindIP}:${MSmartDummycloud.HTTP_PORT}`);
        });

        this.httpServer.on("error", (err) => {
            Logger.error("MSmartDummycloud HTTPS Server Error:", err);
        });
    }

    handleIncomingCloudMessage(msg) {
        const { topic, payload } = msg;

        if (typeof payload.data === "string") {
            try {
                const responseBuffer = Buffer.from(payload.data, "hex");
                const responsePacket = MSmartPacket.FROM_BYTES(responseBuffer);

                Logger.trace("Parsed incoming message:", {
                    topic: topic,
                    nonce: payload.nonce,
                    deviceType: responsePacket.deviceType,
                    messageType: responsePacket.messageType,
                    payload: responsePacket.payload,
                    payloadLength: responsePacket.payload.length
                });

                if (payload.nonce && this.pendingRequests[payload.nonce]) {
                    const pendingRequest = this.pendingRequests[payload.nonce];

                    clearTimeout(pendingRequest.timeout_id);
                    pendingRequest.resolve(responsePacket);
                    delete this.pendingRequests[payload.nonce];

                    Logger.debug(`MSmartDummycloud received response for nonce ${payload.nonce}`);
                    return;
                }

                if (!this.onIncomingCloudMessage(responsePacket)) {
                    Logger.info("Unhandled message received:", responsePacket);
                }

            } catch (parseError) {
                Logger.warn("Failed to parse incoming message:", parseError);

                if (payload.nonce && this.pendingRequests[payload.nonce]) {
                    const pendingRequest = this.pendingRequests[payload.nonce];
                    clearTimeout(pendingRequest.timeout_id);

                    pendingRequest.reject(new Error(`Failed to parse MSmart response: ${parseError.message}`));
                    delete this.pendingRequests[payload.nonce];
                }
            }
        } else if (payload.protocol === "map") { // Observed on the J12
            Logger.trace("Received map-type message:", {
                topic: topic,
                nonce: payload.nonce,
                data: payload.data
            });

            if (typeof payload.data.fullMap === "string") {
                this.onUpload("map", payload.data.fullMap);
            } else {
                Logger.warn("Unhandled map-type message");
            }
        } else if (payload.protocol === "track") { // Observed on the J12
            Logger.trace("Received track-type message:", {
                topic: topic,
                nonce: payload.nonce,
                data: payload.data
            });

            if (typeof payload.data.fullTrack === "string") {
                this.onUpload("track", payload.data.fullTrack);
            } else {
                Logger.warn("Unhandled track-type message");
            }
        } else {
            Logger.warn("Unhandled MQTT message");
        }
    }

    /**
     * @param {string|object} command
     * @param {object} [options]
     * @param {number} [options.timeout] - milliseconds
     * @param {"device"|"ai"|"map"} [options.target] - defaults to "device"
     * @param {boolean} [options.fireAndForget]
     * @returns {Promise<import("./MSmartPacket")>}
     */
    sendCommand(command, options) {
        return new Promise((resolve, reject) => {
            this.sendCommandMutex.take(() => {
                this.actualSendCommand(command, options).then(response => {
                    this.sendCommandMutex.leave();

                    resolve(response);
                }).catch(err => {
                    this.sendCommandMutex.leave();

                    reject(err);
                });
            });
        });
    }

    /**
     * @private
     *
     * @param {string|object} command
     * @param {object} [options]
     * @param {number} [options.timeout] - milliseconds
     * @param {"device"|"ai"|"map"} [options.target] - defaults to "device"
     * @param {boolean} [options.fireAndForget]
     * @returns {Promise<import("./MSmartPacket")>}
     */
    actualSendCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const nonce = crypto.randomUUID();
            const payload = JSON.stringify({
                data: command,
                nonce: nonce,
                version: 1,
                timestamp: Math.round(Date.now() / 1000),
                productId: "valetudo"
            });

            const target = options?.target ?? "device";
            let targetTopic;
            switch (target) {
                case "ai":
                    targetTopic = this.aiCommandTopic;
                    break;
                case "device":
                    targetTopic = this.commandTopic;
                    break;
                case "map":
                    targetTopic = this.mapCommandTopic;
                    break;
            }

            const fireAndForget = !!options?.fireAndForget;
            if (!fireAndForget) {
                this.pendingRequests[nonce] = {
                    resolve: resolve,
                    reject: reject,
                    command: command,
                    onTimeoutCallback: () => {
                        Logger.debug(`Request with nonce ${nonce} timed out`);
                        delete this.pendingRequests[nonce];

                        reject(new MSmartTimeoutError({nonce: nonce, command: command}));
                    }
                };

                this.pendingRequests[nonce].timeout_id = setTimeout(
                    () => {
                        this.pendingRequests[nonce].onTimeoutCallback();
                    },
                    options?.timeout ?? this.timeout
                );
            }

            Logger.trace(`Sending command to ${targetTopic}`, payload);

            this.mqttBroker.publish(
                {
                    cmd: "publish",
                    topic: targetTopic,
                    payload: Buffer.from(payload),
                    qos: 0,
                    retain: false,
                    dup: false,
                },
                (error) => {
                    if (error) {
                        Logger.error(`Error publishing message: ${error}`);

                        if (this.pendingRequests[nonce]) {
                            clearTimeout(this.pendingRequests[nonce].timeout_id);
                            delete this.pendingRequests[nonce];
                        }

                        reject(error);
                    } else if (options.fireAndForget) {
                        // This is a bit janky, but it allows us to have the return type always be an MSmartPacket
                        resolve(new MSmartPacket({messageType: 0, payload: Buffer.alloc(0)}));
                    }
                }
            );
        });
    }

    async shutdown() {
        Logger.debug("MSmartDummycloud shutdown in progress...");

        await new Promise((resolve) => {
            this.httpServer.close(() => {
                Logger.info("MSmartDummycloud HTTPS server shut down");
                resolve();
            });
        });

        await new Promise((resolve) => {
            this.mqttBroker.close(() => {
                this.mqttServer.close(() => {
                    Logger.info("MSmartDummycloud MQTT server shut down");
                    resolve();
                });
            });
        });

        Logger.debug("MSmartDummycloud shutdown done");
    }
}

MSmartDummycloud.MQTT_PORT = 8883;
MSmartDummycloud.HTTP_PORT = 443;

module.exports = MSmartDummycloud;
