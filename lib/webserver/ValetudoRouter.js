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
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;

        //TODO: somewhat ugly here. Refactor?
        this.sshAuthorizedKeysLocation = process.env.VALETUDO_SSH_AUTHORIZED_KEYS_LOCATION ?? "/root/.ssh/authorized_keys";

        //@ts-ignore
        // noinspection PointlessArithmeticExpressionJS
        this.limiter = new RateLimit({
            windowMs: 1*60*1000,
            max: 5
        });

        this.initRoutes();
    }


    initRoutes() {
        /**
         * @swagger
         * /api/v2/valetudo/version:
         *   get:
         *     tags:
         *       - valetudo
         *     summary: Get Valetudo version
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 release:
         *                   type: string
         *                 commit:
         *                   type: string
         */
        this.router.get("/version", (req, res) => {
            res.json({
                release: Tools.GET_VALETUDO_VERSION(),
                commit: Tools.GET_COMMIT_ID()
            });
        });

        /**
         * @swagger
         * /api/v2/valetudo/log/content:
         *   get:
         *     tags:
         *       - valetudo
         *     summary: Get full log
         *     responses:
         *       200:
         *         description: "Ok"
         *         content:
         *           text/plain:
         *             schema:
         *               type: string
         */
        this.router.get("/log/content", this.limiter, (req, res) => {
            res.sendFile(Logger.LogFile);
        });

        /**
         * @swagger
         * /api/v2/valetudo/log/level:
         *   get:
         *     tags:
         *       - valetudo
         *     summary: Get log level
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 current:
         *                   type: string
         *                 presets:
         *                   type: array
         *                   items:
         *                     type: string
         */
        this.router.get("/log/level", (req, res) => {
            res.json({
                current: Logger.LogLevel,
                presets: Object.keys(Logger.LogLevels)
            });
        });

        /**
         * @swagger
         * /api/v2/valetudo/log/level:
         *   put:
         *     tags:
         *       - valetudo
         *     summary: Set log level
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: string
         *             properties:
         *               current:
         *                 type: string
         *     description: Log level retrieved from GET presets
         *     responses:
         *       202:
         *         $ref: "#/components/responses/202"
         */
        this.router.put("/log/level", (req, res) => {
            if (req.body && req.body.level && typeof req.body.level === "string") {
                Logger.LogLevel = req.body.level;
            }
            res.sendStatus(202);
        });

        /**
         * @swagger
         * /api/v2/valetudo/config/interfaces/mqtt:
         *   get:
         *     tags:
         *       - valetudo
         *     summary: Get MQTT configuration
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               $ref: "#/components/schemas/MqttConfigDTO"
         */
        this.router.get("/config/interfaces/mqtt", (req, res) => {
            let mqttConfig = {...this.config.get("mqtt")};

            // don't show password
            if (mqttConfig.password) { //TODO: what about the certificiate? Thats also private
                mqttConfig.password = "****";
            }

            res.json(mqttConfig);
        });

        /**
         * @swagger
         * /api/v2/valetudo/config/interfaces/mqtt:
         *   put:
         *     tags:
         *       - valetudo
         *     summary: Update MQTT configuration
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             $ref: "#/components/schemas/MqttConfigDTO"
         *     responses:
         *       202:
         *         $ref: "#/components/responses/202"
         */
        this.router.put("/config/interfaces/mqtt", (req, res) => {
            let mqttConfig = req.body;
            let oldConfig = this.config.get("mqtt");

            // keep password if not changed
            if (oldConfig.server === mqttConfig.server && mqttConfig.password === "****") {
                mqttConfig.password = oldConfig.password;
            }

            this.config.set("mqtt", mqttConfig);

            res.sendStatus(202);
        });

        /**
         * @swagger
         * /api/v2/valetudo/config/interfaces/http/auth/basic:
         *   get:
         *     tags:
         *       - valetudo
         *     summary: Get HTTP basic auth configuration
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               $ref: "#/components/schemas/BasicAuthConfigDTO"
         */
        this.router.get("/config/interfaces/http/auth/basic", (req, res) => {
            res.json({...this.config.get("webserver").basicAuth, password: ""});
        });

        /**
         * @swagger
         * /api/v2/valetudo/config/interfaces/http/auth/basic:
         *   put:
         *     tags:
         *       - valetudo
         *     summary: Update MQTT configuration
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             $ref: "#/components/schemas/BasicAuthConfigDTO"
         *     responses:
         *       201:
         *         $ref: "#/components/responses/201"
         *       400:
         *         $ref: "#/components/responses/400"
         *
         */
        this.router.put("/config/interfaces/http/auth/basic", (req, res) => {
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

            /**
             * @swagger
             * /api/v2/valetudo/config/interfaces/ssh/keys:
             *   get:
             *     tags:
             *       - valetudo
             *     summary: Get SSH authorized keys
             *     responses:
             *       200:
             *         description: "Ok"
             *         content:
             *           text/plain:
             *             schema:
             *               type: string
             *       403:
             *         $ref: "#/components/responses/403"
             */
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

            /**
             * @swagger
             * /api/v2/valetudo/config/interfaces/ssh/keys:
             *   put:
             *     tags:
             *       - valetudo
             *     summary: Update SSH authorized keys
             *     requestBody:
             *       content:
             *         application/json:
             *           schema:
             *             type: object
             *             properties:
             *               keys:
             *                 type: string
             *     responses:
             *       201:
             *         $ref: "#/components/responses/201"
             *       400:
             *         $ref: "#/components/responses/400"
             *       403:
             *         $ref: "#/components/responses/403"
             */
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

            /**
             * @swagger
             * /api/v2/valetudo/config/interfaces/ssh:
             *   put:
             *     tags:
             *       - valetudo
             *     summary: Update SSH configuration
             *     requestBody:
             *       content:
             *         application/json:
             *          schema:
             *            type: object
             *            properties:
             *              action:
             *                type: string
             *                enum:
             *                  - disable_key_upload
             *     responses:
             *       201:
             *         $ref: "#/components/responses/201"
             *       400:
             *         $ref: "#/components/responses/400"
             */
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
