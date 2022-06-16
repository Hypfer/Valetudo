const express = require("express");
const Logger = require("../Logger");

class UpdaterRouter {
    /**
     *
     * @param {object} options
     * @param {import("../updater/Updater")} options.updater
     * @param {import("../Configuration")} options.config
     * @param {*} options.validator
     */
    constructor(options) {
        this.router = express.Router({mergeParams: true});

        this.config = options.config;
        this.updater = options.updater;
        this.validator = options.validator;

        this.initRoutes();
    }


    initRoutes() {
        this.router.get("/state", (req, res) => {
            res.json(this.updater.state);
        });

        this.router.put("/", this.validator, async (req, res) => {
            try {
                switch (req.body.action) {
                    case "check":
                        this.updater.triggerCheck();
                        break;
                    case "download":
                        this.updater.triggerDownload();
                        break;
                    case "apply":
                        this.updater.triggerApply();
                        break;
                    default:
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error("Invalid action");
                }

                res.sendStatus(200);
            } catch (e) {
                Logger.warn("Error while executing action \"" + req.body.action + "\" for Updater", e);
                res.status(400).json(e.message);
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = UpdaterRouter;
