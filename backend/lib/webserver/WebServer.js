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

const Middlewares = require("./middlewares");
const RobotRouter = require("./RobotRouter");
const ValetudoRouter = require("./ValetudoRouter");


const fs = require("fs");
const MiioValetudoRobot = require("../robots/MiioValetudoRobot");
const NTPClientRouter = require("./NTPClientRouter");
const SystemRouter = require("./SystemRouter");
const TimerRouter = require("./TimerRouter");

class WebServer {
    /**
     * @param {object} options
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {import("../NTPClient")} options.ntpClient
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

        this.app.disable("x-powered-by");
        this.app.use(Middlewares.VersionMiddleware);

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


        // Allow enabling capability to send custom miio commands over the REST API, for debugging purposes only
        let enableDebugCapability = false;
        if (this.config.get("debug") && typeof this.config.get("debug").enableDebugCapability === "boolean") {
            enableDebugCapability = this.config.get("debug").enableDebugCapability;
        }
        if (enableDebugCapability) {
            Logger.warn("Raw command capability is enabled. This feature should only be used by developers.");
        }

        this.robotRouter = new RobotRouter({robot: this.robot, enableDebugCapability: enableDebugCapability});

        this.app.use("/api/v2/robot/", this.robotRouter.getRouter());

        this.app.use("/api/v2/valetudo/", new ValetudoRouter({config: this.config, validator: this.validator}).getRouter());

        this.app.use("/api/v2/ntpclient/", new NTPClientRouter({config: this.config, ntpClient: options.ntpClient, validator: this.validator}).getRouter());

        this.app.use("/api/v2/timers/", new TimerRouter({config: this.config, robot: this.robot}).getRouter());

        this.app.use("/api/v2/system/", new SystemRouter({}).getRouter());

        // TODO: This should point at a build
        this.app.use(express.static(path.join(__dirname, "../../..", "frontend/lib")));


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
