const express = require("express");
const http = require("http");
const path = require("path");
const compression = require("compression");
const bodyParser = require("body-parser");
const dynamicMiddleware = require("express-dynamic-middleware");
const basicAuth = require("express-basic-auth");

const listEndpoints = require("express-list-endpoints");

const Logger = require("../Logger");

const RobotRouter = require("./RobotRouter");
const ValetudoRouter = require("./ValetudoRouter");


const MiioValetudoRobot = require("../robots/MiioValetudoRobot");

class WebServer {
    /**
     * @param {object} options
     * @param options.robot
     * @param {import("../Configuration")} options.config
     */

    constructor(options) {
        const self = this;

        this.robot = options.robot;
        this.config = options.config;

        this.webserverConfig = this.config.get("webserver");

        this.port = this.webserverConfig.port;

        this.basicAuthInUse = false; //TODO: redo auth with jwt or something like that

        this.app = express();
        this.app.use(compression());
        this.app.use(bodyParser.json());

        const authMiddleware = this.createAuthMiddleware();
        const dynamicAuth = dynamicMiddleware.create([]);
        this.app.use(dynamicAuth.handle());

        if (this.webserverConfig.basicAuth.enabled === true) {
            dynamicAuth.use(authMiddleware);
            this.basicAuthInUse = true;
        }

        this.config.onUpdate((key) => {
            if (key === "webserver") {
                this.webserverConfig = this.config.get("webserver");

                if (this.basicAuthInUse && !this.webserverConfig.basicAuth.enabled) {
                    dynamicAuth.unuse(authMiddleware);
                    this.basicAuthInUse = false;
                } else if (!this.basicAuthInUse && this.webserverConfig.basicAuth.enabled) {
                    dynamicAuth.use(authMiddleware);
                    this.basicAuthInUse = true;
                }
            }
        });

        const server = http.createServer(this.app);

        // Allow enabling capability to send custom miio commands over the REST API, for debugging purposes only
        let enableRawCommandCapability = false;
        if (this.config.get("debug") && typeof this.config.get("debug").enableRawCommandCapability === "boolean") {
            enableRawCommandCapability = this.config.get("debug").enableRawCommandCapability;
        }
        if (enableRawCommandCapability) {
            Logger.warn("Raw command capability is enabled. This feature should only be used by developers.");
        }

        this.robotRouter = new RobotRouter({robot: this.robot, enableRawCommandCapability: enableRawCommandCapability});

        this.app.use("/api/v2/robot/", this.robotRouter.getRouter());

        this.app.use("/api/v2/valetudo/", new ValetudoRouter({config: this.config}).getRouter());

        this.app.use(express.static(path.join(__dirname, "../..", "client")));

        this.app.get("/api/v2", (req, res) => {
            let endpoints = listEndpoints(this.app);
            let endpointsMap;
            endpoints = endpoints.sort((a,b) => (a.path > b.path) ? 1 : ((b.path > a.path) ? -1 : 0));
            endpointsMap = endpoints.reduce((acc, curr) => {
                acc[curr.path] = {methods: curr.methods}; return acc;
            }, {});

            res.json(endpointsMap);
        });

        /*
            TODO: MOVE THIS HACK ELSEWHERE!

             This is a hack for miio vacuums with a recent miio_client

             To properly spoof the http_dns request, we need to have this route on port 80 instead of the
             miio-implementation specific second webserver on 8079 :/
         */
        if (this.robot instanceof MiioValetudoRobot) {
            this.app.get("/gslb", (req, res) => {
                this.robot.handleHttpDnsRequest(req, res);
            });
        }

        this.app.use((err, req, res, next) => {
            Logger.error("Unhandled WebServer Error", err);
        });

        server.listen(this.port, function() {
            Logger.info("Webserver running on port", self.port);
        });

        this.webserver = server;
    }

    /**
     * @private
     * @returns {(req: any, res: any, next: any) => void}
     */
    createAuthMiddleware() {
        const basicAuthMiddleware = basicAuth({
            authorizer: (username, password) => {
                const basicAuthConf = this.config.get("webserver").basicAuth;

                const userMatches = basicAuth.safeCompare(username, basicAuthConf.username);
                const passwordMatches = basicAuth.safeCompare(password, basicAuthConf.password);

                return userMatches && passwordMatches;
            },
            challenge: true,
            unauthorizedResponse: (req) => {
                return req.auth ? "Invalid credentials" : "No credentials provided";
            }
        });

        return function authMiddleware(req, res, next) {
            try {
                basicAuthMiddleware(req, res, next);
            } catch (e) { /* basicAuth throws [ERR_HTTP_HEADERS_SENT] here if invalid credentials are sent */
                Logger.error("Error in BasicAuthMiddleware", e);
            }
        };
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
