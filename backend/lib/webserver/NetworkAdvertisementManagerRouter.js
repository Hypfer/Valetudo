const express = require("express");


class NetworkAdvertisementManagerRouter {
    /**
     *
     * @param {object} options
     * @param {import("../NetworkAdvertisementManager")} options.networkAdvertisementManager
     * @param {import("../Configuration")} options.config
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});
        this.networkAdvertisementManager = options.networkAdvertisementManager;
        this.config = options.config;
        this.validator = options.validator;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/config", (req, res) => {
            res.json(this.config.get("networkAdvertisement"));
        });

        this.router.put("/config", this.validator, (req, res) => {
            if (typeof req.body.enabled === "boolean") {
                const conf = this.config.get("networkAdvertisement");
                this.config.set("networkAdvertisement", Object.assign({}, conf, {enabled: req.body.enabled}));

                res.sendStatus(200);
            } else {
                res.sendStatus(400);
            }
        });


        this.router.get("/properties", (req, res) => {
            res.json(this.networkAdvertisementManager.getProperties());
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = NetworkAdvertisementManagerRouter;
