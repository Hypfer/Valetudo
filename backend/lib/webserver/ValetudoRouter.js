const express = require("express");
const fs = require("fs");
const RateLimit = require("express-rate-limit");

const Logger = require("../Logger");
const Tools = require("../Tools");

class ValetudoRouter {
    /**
     *
     * @param {object} options
     * @param {import("../Configuration")} options.config
     * @param {import("../core/ValetudoRobot")} options.robot
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;
        this.robot = options.robot;
        this.validator = options.validator;

        //TODO: somewhat ugly here. Refactor?
        this.sshAuthorizedKeysLocation = process.env.VALETUDO_SSH_AUTHORIZED_KEYS_LOCATION ?? "/root/.ssh/authorized_keys";

        //@ts-ignore
        // noinspection PointlessArithmeticExpressionJS
        this.limiter = new RateLimit({
            windowMs: 1*30*1000,
            max: 30
        });

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/version", (req, res) => {
            res.json({
                release: Tools.GET_VALETUDO_VERSION(),
                commit: Tools.GET_COMMIT_ID()
            });
        });

        this.router.get("/log/content", this.limiter, (req, res) => {
            res.sendFile(Logger.LogFile);
        });

        this.router.get("/log/level", (req, res) => {
            res.json({
                current: Logger.LogLevel,
                presets: Object.keys(Logger.LogLevels)
            });
        });

        this.router.put("/log/level", this.validator, (req, res) => {
            if (req.body && req.body.level && typeof req.body.level === "string") {
                Logger.LogLevel = req.body.level;

                res.sendStatus(202);
            } else {
                res.sendStatus(400);
            }

        });

        this.router.get("/config/interfaces/mqtt", (req, res) => {
            let mqttConfig = {...this.config.get("mqtt")};

            // don't show password
            if (mqttConfig.password) { //TODO: what about the certificiate? Thats also private
                mqttConfig.password = "****";
            }

            res.json(mqttConfig);
        });

        this.router.get("/config/interfaces/mqtt/properties", (req, res) => {
            //It might make sense to pull this from the mqttController but that would introduce a dependency between the webserver and the mqttController :/
            res.json({
                defaults: {
                    identity: {
                        friendlyName: this.robot.getModelName() + " " + Tools.GET_HUMAN_READABLE_SYSTEM_ID(),
                        identifier: Tools.GET_HUMAN_READABLE_SYSTEM_ID()
                    },
                    customizations: {
                        topicPrefix: "valetudo"
                    }
                }
            });
        });

        this.router.put("/config/interfaces/mqtt", this.validator, (req, res) => {
            let mqttConfig = req.body;
            let oldConfig = this.config.get("mqtt");

            // keep password if not changed
            if (oldConfig.server === mqttConfig.server && mqttConfig.password === "****") {
                mqttConfig.password = oldConfig.password;
            }

            this.config.set("mqtt", mqttConfig);

            res.sendStatus(202);
        });

        this.router.get("/config/interfaces/http/auth/basic", (req, res) => {
            res.json({...this.config.get("webserver").basicAuth, password: ""});
        });

        this.router.put("/config/interfaces/http/auth/basic", this.validator, (req, res) => {
            if (
                req.body && typeof req.body === "object" &&
                typeof req.body.enabled === "boolean" &&
                typeof req.body.username === "string" &&
                typeof req.body.password === "string"
            ) {
                const webserverConfig = this.config.get("webserver");

                const options = {
                    enabled: req.body.enabled,
                    username: req.body.username,
                    password: req.body.password
                };


                if (!options.password && (webserverConfig.basicAuth.enabled === false && options.enabled === true)) {
                    res.status(400).send("Missing password for basic auth enable. Don't lock yourself out!");
                } else {
                    webserverConfig.basicAuth = options;

                    this.config.set("webserver", webserverConfig);
                    res.sendStatus(201);
                }
            } else {
                res.status(400).send("bad request body");
            }

        });

        if (this.config.get("embedded") === true) {
            //TODO: these are very ugly..
            this.router.get("/config/interfaces/ssh/keys", async (req, res) => {
                if (!this.config.get("allowSSHKeyUpload")) {
                    return res.status(403).send("Forbidden");
                }

                try {
                    let data = await fs.promises.readFile(this.sshAuthorizedKeysLocation, {"encoding": "utf-8"});

                    res.json(data);
                } catch (err) {
                    // @ts-ignore
                    if (err instanceof Error && err.code === "ENOENT") {
                        res.json("");
                    } else {
                        res.status(500).send(err.toString());
                    }

                }
            });

            this.router.put("/config/interfaces/ssh/keys", async (req, res) => {
                try {
                    if (!this.config.get("allowSSHKeyUpload")) {
                        return res.status(403).send("Forbidden");
                    }
                    if (req.body && req.body.keys && typeof req.body.keys === "string") {
                        await fs.promises.writeFile(this.sshAuthorizedKeysLocation, req.body.keys, {"encoding": "utf-8"});

                        res.sendStatus(201);
                    } else {
                        res.status(400).send("Invalid request");
                    }
                } catch (err) {
                    res.status(500).send(err.toString());
                }
            });

            this.router.put("/config/interfaces/ssh", async (req, res) => { //TODO: change in UI
                try {
                    if (req.body && req.body.action && req.body.action === "disable_key_upload") {
                        await this.config.set("allowSSHKeyUpload", false);

                        res.json("success");
                    } else {
                        res.status(400).send("Invalid request");
                    }
                } catch (err) {
                    res.status(500).send(err.toString());
                }
            });

        }



    }

    getRouter() {
        return this.router;
    }
}

module.exports = ValetudoRouter;
