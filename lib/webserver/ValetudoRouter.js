const express = require("express");
const fs = require("fs");

const Tools = require("../Tools");


class ValetudoRouter {
    /**
     *
     * @param options {object}
     * @param options.config
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/version", (req, res) => {
            res.json({
                release: Tools.GET_VALETUDO_VERSION()
            });
        });

        this.router.get("/config/interfaces/mqtt", (req, res) => {
            let mqttConfig = {...this.config.get("mqtt")};

            // don't show password
            if (mqttConfig.password) { //TODO: what about the certificiate? Thats also private
                mqttConfig.password = "****";
            }

            res.json(mqttConfig);
        });

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

        this.router.get("/config/interfaces/http/auth/basic", (req, res) => {
            res.json({...this.config.get("webserver").basicAuth, password: ""});
        });

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


                if (!options.password) {
                    // Don't set password to empty string, keep old one
                    options.password = webserverConfig.basicAuth.password;
                }

                webserverConfig.basicAuth = options;

                this.config.set("webserver", webserverConfig);
                res.sendStatus(201);
            } else {
                res.status(400).send("bad request body");
            }

        });

        if (this.config.get("embedded") === true) {
            //TODO: these are very ugly..
            this.router.get("/config/interfaces/ssh/keys", async (req, res) => {
                try {
                    if (!this.config.get("allowSSHKeyUpload")) {
                        return res.status(403).send("Forbidden");
                    }
                    let data = await fs.promises.readFile("/root/.ssh/authorized_keys", {"encoding": "utf-8"});

                    res.json(data);
                } catch (err) {
                    res.status(500).send(err.toString());
                }
            });

            this.router.put("/config/interfaces/ssh/keys", async (req, res) => {
                try {
                    if (!this.config.get("allowSSHKeyUpload")) {
                        return res.status(403).send("Forbidden");
                    }
                    if (req.body && req.body.keys && typeof req.body.keys === "string") {
                        await fs.promises.writeFile("/root/.ssh/authorized_keys", req.body.keys, {"encoding": "utf-8"});

                        res.json("success");
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