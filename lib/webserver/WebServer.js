
const express = require("express");
const http = require("http");
const compression = require("compression");
const path = require("path");
const zlib = require("zlib");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const dynamicMiddleware = require("express-dynamic-middleware");
const basicAuth = require("express-basic-auth");
const Logger = require("../Logger");
const ApiRouter = require("./ApiRouter");
const DeviceRouter = require("./DeviceRouter");

class WebServer {
    /**
     * @param {object} options
     * @param {import("../devices/MiioVacuum")} options.vacuum
     * @param {import("../Configuration")} options.configuration
     * @param {import("../Events")} options.events
     * @param {import("../SSHManager")} options.sshManager
     * @param {import("../miio/Model")} options.model
     */
    constructor(options) {
        const self = this;

        this.vacuum = options.vacuum;
        this.configuration = options.configuration;
        this.events = options.events;
        this.sshManager = options.sshManager;
        this.model = options.model;
        this.port = this.configuration.get("webserver").port;

        this.mapUploadInProgress = false;
        this.basicAuthInUse = false;
        this.app = express();
        this.app.use(compression());
        this.app.use(bodyParser.json());

        let authMiddleware = this.createAuthMiddleware();
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

        this.app.use("/", DeviceRouter(this));
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
     * @private
     * @param {import("http").Server} server
     */
    initWebSocketServer(server) {
        const wss = new WebSocket.Server({ server });

        this.events.onMapUpdated(() => {
            // don't need to compress anything if all clients are still in progress
            // @ts-ignore
            if (!Array.from(wss.clients).some(ws => !ws.mapUploadInProgress)) {
                return;
            }
            // zlib compression on map.parsedData allows to send up to 5x times less data via the network
            zlib.deflate(JSON.stringify(this.vacuum.robotState.map), (err, buf) => {
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
                ws.ping();
                ws.send("");
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
            // @ts-ignore
            ws.on("pong", () => ws.isAlive = true);

            if (this.vacuum.robotState.map) {
                zlib.deflate(JSON.stringify(this.vacuum.robotState.map), (err, buf) => {
                    if (!err) {
                        ws.send(buf);
                    }

                });
            }
        });
    }

    /**
     * @private
     * @returns {(req: any, res: any, next: any) => void}
     */
    createAuthMiddleware() {
        let self = this;

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

        return authMiddleware;
    }

    /**
     * Shutdown webserver
     *
     * @public
     * @returns {Promise<void>}
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
