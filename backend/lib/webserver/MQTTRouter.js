const express = require("express");

class MQTTRouter {
    /**
     *
     * @param {object} options
     * @param {import("../mqtt/MqttController")} options.mqttController
     * @param {import("../Configuration")} options.config
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;
        this.mqttController = options.mqttController;
        this.validator = options.validator;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/status", (req, res) => {
            res.json(this.mqttController.getStatus());
        });

        this.router.get("/properties", (req, res) => {
            res.json({
                defaults: this.mqttController.getConfigDefaults()
            });
        });

    }

    getRouter() {
        return this.router;
    }
}

module.exports = MQTTRouter;
