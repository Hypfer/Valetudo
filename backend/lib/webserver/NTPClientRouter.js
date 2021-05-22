const express = require("express");

class NTPClientRouter {
    /**
     *
     * @param {object} options
     * @param {import("../NTPClient")} options.ntpClient
     * @param {import("../Configuration")} options.config
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;
        this.ntpClient = options.ntpClient;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/state", (req, res) => {
            res.json(this.ntpClient.state);
        });

        this.router.get("/config", (req, res) => {
            res.json(this.config.get("ntpClient"));
        });

        this.router.put("/config", (req, res) => {
            res.json(this.config.get("ntpClient"));

            this.config.set("ntpClient", req.body);

            res.sendStatus(202);
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = NTPClientRouter;
