const express = require("express");

class NTPClientRouter {
    /**
     *
     * @param {object} options
     * @param {import("../NTPClient")} options.ntpClient
     * @param {import("../Configuration")} options.config
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;
        this.ntpClient = options.ntpClient;
        this.validator = options.validator;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/state", (req, res) => {
            res.json(this.ntpClient.state);
        });

        this.router.get("/config", (req, res) => {
            res.json(this.config.get("ntpClient"));
        });

        this.router.put("/config", this.validator, (req, res) => {
            this.config.set("ntpClient", {
                enabled: req.body.enabled,
                server: req.body.server,
                port: req.body.port,
                interval: req.body.interval,
                timeout: req.body.timeout
            });

            res.sendStatus(200);
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = NTPClientRouter;
