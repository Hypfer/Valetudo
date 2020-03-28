
const express = require("express");
const http = require("http");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const dynamicMiddleware = require("express-dynamic-middleware");
const basicAuth = require("express-basic-auth");
const DummyCloud = require("../miio/Dummycloud");
const Logger = require("../Logger");
const ApiRouter = require("./ApiRouter");

class WebServer {
    /**
     * @param {object} options
     * @param {import("../devices/MiioVacuum")} options.vacuum
     * @param {number} options.port
     * @param {import("../Configuration")} options.configuration
     * @param {import("events").EventEmitter} options.events
     * @param {import("../dtos/MapDTO")} options.map
     * @param {import("../SSHManager")} options.sshManager
     * @param {import("../miio/Model")} options.model
     * @param {Buffer} options.cloudKey required to sign /gslb responses
     */
    constructor(options) {
        const self = this;

        this.vacuum = options.vacuum;
        this.port = options.port;
        this.configuration = options.configuration;
        this.events = options.events;
        this.sshManager = options.sshManager;
        this.cloudKey = options.cloudKey;
        this.model = options.model;

        this.map = options.map;

        this.mapUploadInProgress = false;
        this.basicAuthInUse = false;
        this.app = express();
        this.app.use(compression());
        this.app.use(bodyParser.json());

        this.uploadLocation = "/mnt/data/valetudo/uploads";
        fs.readdir(this.uploadLocation, (err, files) => {
            if (!err){ //remove all previous uploads
                for (const file of files) {
                    fs.unlink(path.join(this.uploadLocation, file), (rmerr) => {});
                }
            }
        });

        const basicAuthUnauthorizedResponse = function(req) {
            return req.auth ? ("Credentials \"" + req.auth.user + ":" + req.auth.password + "\" rejected") : "No credentials provided";
        };

        const basicAuthMiddleware = basicAuth({authorizer: function(username, password) {
            const userMatches = basicAuth.safeCompare(username, self.configuration.get("httpAuth").username);
            const passwordMatches = basicAuth.safeCompare(password, self.configuration.get("httpAuth").password);
            return userMatches && passwordMatches;
        }, challenge: true, unauthorizedResponse: basicAuthUnauthorizedResponse});

        const authMiddleware = function(req, res, next) {
            if (["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.ip)) {
                // Allow requests from localhost
                next();
            } else {
                // Authenticate other ones
                try {
                    basicAuthMiddleware(req, res, next);
                } catch (e) { /* basicAuth throws [ERR_HTTP_HEADERS_SENT] here if invalid credentials are sent */ }
            }
        };
        const dynamicAuth = dynamicMiddleware.create([]);
        this.app.use(dynamicAuth.handle());

        if (this.configuration.get("httpAuth").enabled) {
            dynamicAuth.use(authMiddleware);
            this.basicAuthInUse = true;
        }

        this.setBasicAuth = (enabled, username, password) => {
            if (!password) {
                // Don't set password to empty string, keep old one
                password = this.configuration.get("httpAuth").password;
            }
            this.configuration.set("httpAuth", {
                enabled: enabled,
                username: username,
                password: password,
            });
            if (this.basicAuthInUse && !enabled) {
                dynamicAuth.unuse(authMiddleware);
                this.basicAuthInUse = false;
            } else if (!this.basicAuthInUse && enabled) {
                dynamicAuth.use(authMiddleware);
                this.basicAuthInUse = true;
            }
        };

        this.app.put("/api/miio/map_upload_handler", (req, res) => {
            Logger.debug("map_upload_handler", req.query);
            if (!self.mapUploadInProgress) {
                self.mapUploadInProgress = true;

                var data = [];
                req.on("data", chunk => data.push(chunk));

                req.on("end", () => {
                    const uploadedGzippedMapData = Buffer.concat(data);
                    this.vacuum.preprocessMap(uploadedGzippedMapData)
                        .then(data => {
                            const dataToHash = data.length > 48 ? data.slice(20, data.length - 29) : data; //strip index,sequence + digest
                            const hashOfNewMap = crypto.createHash("sha1").update(dataToHash).digest("base64");

                            if (hashOfNewMap !== self.map.hash) {
                                const parsedMap = this.vacuum.parseMap(data);

                                if (parsedMap !== null) {
                                    self.map.parsedData = parsedMap;
                                    self.map.hash = hashOfNewMap;

                                    self.events.emit("valetudo.map");
                                }
                            }
                        })
                        .finally(() => self.mapUploadInProgress = false);
                    res.sendStatus(200);
                });
            } else {
                //This prevents valetudo from leaking memory
                res.end();
                req.connection.destroy();
            }
        });

        // clang-format off
        /*
        Handle viomi load balancing requests:

        GET /gslb?tver=2&id=277962183&dm=ot.io.mi.com&timestamp=1574455630&sign=nNevMcHtzuB90okJfG9zSyPTw87u8U8HQpVNXqpVt%2Bk%3D HTTP/1.1
        Host:110.43.0.83
        User-Agent:miio-client

        {"info":{"host_list":[{"ip":"120.92.65.244","port":8053},{"ip":"120.92.142.94","port":8053},{"ip":"58.83.177.237","port":8053},{"ip":"58.83.177.239","port":8053},{"ip":"58.83.177.236","port":8053},{"ip":"120.92.65.242","port":8053}],"enable":1},"sign":"NxPNmsa8eh2/Y6OdJKoEaEonR6Lvrw5CkV5+mnpZois=","timestamp":"1574455630"}
        */
        // clang-format on
        this.app.get("/gslb", (req, res) => {
            const dummycloudIP = this.configuration.get("dummycloud").spoofedIP;
            const info = {"host_list": [{"ip": dummycloudIP, "port": DummyCloud.PORT}], "enable": 1};
            const signature = crypto.createHmac("sha256", this.cloudKey)
                .update(JSON.stringify(info))
                .digest("base64");
            res.status(200).send(
                {"info": info, "timestamp": req.query["timestamp"], "sign": signature});
        });

        this.app.use("/api", ApiRouter(this));
        this.app.use(express.static(path.join(__dirname, "../..", "client")));
        const server = http.createServer(this.app);
        this.initWebSocketServer(server);
        server.listen(this.port, function() {
            Logger.info("Webserver running on port", self.port);
        });
        this.webserver = server;
    }

    /**
     * @param {import("http").Server} server
     */
    initWebSocketServer(server) {
        const wss = new WebSocket.Server({ server });

        //function to catch alive ws
        function heartbeat() {
            this.isAlive = true;
        }

        function noop() {}

        this.events.on("valetudo.map", () => {
            // don't need to compress anything if all clients are still in progress
            // @ts-ignore
            if (!Array.from(wss.clients).some(ws => !ws.mapUploadInProgress)) {
                return;
            }
            // zlib compression on map.parsedData allows to send up to 5x times less data via the network
            zlib.deflate(JSON.stringify(this.map.parsedData), (err, buf) => {
                //Too many connected clients might cause valetudo to go OOM
                //If this is the case, we should limit the amount of concurrent responses
                //However for now, it should be sufficient to just limit the concurrent responses per client to one
                if (!err)
                    wss.clients.forEach(function each(ws) {
                        // @ts-ignore
                        if (!ws.mapUploadInProgress) {
                            // @ts-ignore
                            ws.mapUploadInProgress = true;

                            ws.send(buf, function () {
                                // @ts-ignore
                                ws.mapUploadInProgress = false;
                            });
                        }
                    });
            });
        });

        setInterval(function () {
            wss.clients.forEach(function each(ws) {
                //terminate inactive ws
                // @ts-ignore
                if (ws.isAlive === false) return ws.terminate();

                //mark ws as inactive
                // @ts-ignore
                ws.isAlive = false;
                //ask ws to send a pong to be marked as active
                ws.ping(noop);
                ws.send("", noop);
                /**
                 * We have to send both, since ping is a browser feature which the client can't see
                 * To reconnect the client, we do however need to see if we're still connected
                 */
            });
        }, 2000);

        wss.on("connection", (ws) => {
            //set ws as alive
            // @ts-ignore
            ws.isAlive = true;
            //attach pong function
            ws.on("pong", heartbeat);

            if (this.map.parsedData) {
                zlib.deflate(JSON.stringify(this.map.parsedData), (err, buf) => {
                    if (!err) {
                        ws.send(buf, noop);
                    }

                });
            }
        });
    }

    /**
     * Shutdown webserver
     * @return {Promise<void>}
     */
    shutdown() {
        return new Promise((resolve, reject) => {
            Logger.debug("Webserver shutdown in progress...");

            //closing the server
            this.webserver.close(() => {
                Logger.debug("Webserver shutdown done");
                resolve();
            });
        });
    }
}

module.exports = WebServer;
