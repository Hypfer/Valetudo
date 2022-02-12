const basicAuth = require("express-basic-auth");
const bodyParser = require("body-parser");
const compression = require("compression");
const dynamicMiddleware = require("express-dynamic-middleware");
const express = require("express");
const http = require("http");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerValidation = require("openapi-validator-middleware");

const listEndpoints = require("express-list-endpoints");

const Logger = require("../Logger");

const notFoundPages = require("./res/404");

const Middlewares = require("./middlewares");
const RobotRouter = require("./RobotRouter");
const ValetudoRouter = require("./ValetudoRouter");


const fs = require("fs");
const MiioValetudoRobot = require("../robots/MiioValetudoRobot");
const MQTTRouter = require("./MQTTRouter");
const NTPClientRouter = require("./NTPClientRouter");
const SSDPRouter = require("./SSDPRouter");
const SystemRouter = require("./SystemRouter");
const TimerRouter = require("./TimerRouter");
const Tools = require("../utils/Tools");
const UpdaterRouter = require("./UpdaterRouter");
const ValetudoEventRouter = require("./ValetudoEventRouter");

class WebServer {
    /**
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {import("../mqtt/MqttController")} options.mqttController
     * @param {import("../NTPClient")} options.ntpClient
     * @param {import("../updater/Updater")} options.updater
     * @param {import("../ValetudoEventStore")} options.valetudoEventStore
     * @param {import("../Configuration")} options.config
     */
    constructor(options) {
        const self = this;

        this.robot = options.robot;
        this.config = options.config;

        this.valetudoEventStore = options.valetudoEventStore;

        this.webserverConfig = this.config.get("webserver");

        this.port = this.webserverConfig.port;

        this.basicAuthInUse = false; //TODO: redo auth with jwt or something like that

        this.app = express();
        this.app.use(compression());
        this.app.use(bodyParser.json());

        this.app.disable("x-powered-by");

        this.app.use(Middlewares.CSPMiddleware);
        this.app.use(Middlewares.VersionMiddleware);
        this.app.use(Middlewares.ServerMiddleware);

        if (this.webserverConfig.blockExternalAccess) {
            this.app.use(Middlewares.ExternalAccessCheckMiddleware);
        }

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

        this.loadApiSpec();
        this.validator = function noOpValidationMiddleware(req, res, next) {
            next();
        };

        if (this.openApiSpec) {
            this.app.use("/swagger/", swaggerUi.serve, swaggerUi.setup(this.openApiSpec, {
                customCss: ".swagger-ui .topbar { display: none }"
            }));

            swaggerValidation.init(this.openApiSpec);
            this.validator = swaggerValidation.validate;
        }

        this.robotRouter = new RobotRouter({robot: this.robot, validator: this.validator});
        this.valetudoRouter = new ValetudoRouter({config: this.config, robot: this.robot, validator: this.validator});

        this.app.use("/api/v2/robot/", this.robotRouter.getRouter());

        this.app.use("/api/v2/valetudo/", this.valetudoRouter.getRouter());

        this.app.use("/api/v2/mqtt/", new MQTTRouter({config: this.config, mqttController: options.mqttController, validator: this.validator}).getRouter());

        this.app.use("/api/v2/ntpclient/", new NTPClientRouter({config: this.config, ntpClient: options.ntpClient, validator: this.validator}).getRouter());

        this.app.use("/api/v2/timers/", new TimerRouter({config: this.config, robot: this.robot, validator: this.validator}).getRouter());

        this.app.use("/api/v2/system/", new SystemRouter({}).getRouter());

        this.app.use("/api/v2/events/", new ValetudoEventRouter({valetudoEventStore: this.valetudoEventStore, validator: this.validator}).getRouter());

        this.app.use("/api/v2/updater/", new UpdaterRouter({config: this.config, updater: options.updater, validator: this.validator}).getRouter());

        this.app.use("/_ssdp/", new SSDPRouter({config: this.config, robot: this.robot}).getRouter());

        this.app.use(express.static(path.join(__dirname, "../../..", "frontend/build")));

        this.app.use("/old_frontend", express.static(path.join(__dirname, "../../..", "old_frontend/lib")));

        this.app.get("/api/v2", (req, res) => {
            let endpoints = listEndpoints(this.app);
            let endpointsMap;
            endpoints = endpoints.sort((a,b) => {
                if (a.path > b.path) {
                    return 1;
                } else if (b.path > a.path) {
                    return -1;
                } else {
                    return 0;
                }
            });
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
                //@ts-ignore
                this.robot.handleHttpDnsRequest(req, res);
            });
        }

        this.app.use((err, req, res, next) => {
            if (err instanceof swaggerValidation.InputValidationError) {
                Logger.warn("Received request with invalid payload", err.errors);
                res.status(400).json({message: "Request payload is invalid.", error: err.errors});
            } else {
                Logger.error("Unhandled WebServer Error", err);
                res.sendStatus(500);
            }
        });

        this.app.get("*", (req, res) => {
            res.status(404).send(Tools.GET_RANDOM_ARRAY_ELEMENT(Object.values(notFoundPages)));
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
            this.robotRouter.shutdown();
            this.valetudoRouter.shutdown();

            //closing the server
            this.webserver.close(() => {
                Logger.debug("Webserver shutdown done");
                resolve();
            });
        });
    }

    /**
     * @private
     */
    loadApiSpec() {
        let spec;

        try {
            spec = JSON.parse(fs.readFileSync(path.join(__dirname, "../res/valetudo.openapi.schema.json")).toString());
        } catch (e) {
            Logger.warn("Failed to load OpenApi spec. Swagger endpoint and payload validation will be unavailable.", e.message);
        }

        this.openApiSpec = spec;
    }
}

module.exports = WebServer;
