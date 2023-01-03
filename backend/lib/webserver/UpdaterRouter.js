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

        this.router.get("/config", (req, res) => {
            const currentConfig = this.config.get("updater");

            res.json({
                updateProvider: currentConfig.updateProvider.type
            });
        });

        this.router.put("/config", this.validator, (req, res) => {
            if (typeof req.body.updateProvider === "string") {
                const currentConfig = this.config.get("updater");

                let newUpdateProviderConfig;

                switch (req.body.updateProvider) {
                    case "github":
                        newUpdateProviderConfig = {
                            type: "github",
                            implementationSpecificConfig: {}
                        };
                        break;
                    case "github_nightly":
                        newUpdateProviderConfig = {
                            type: "github_nightly",
                            implementationSpecificConfig: {}
                        };

                        break;
                }

                if (newUpdateProviderConfig) {
                    this.config.set("updater", Object.assign({}, currentConfig, {updateProvider: newUpdateProviderConfig}));

                    res.sendStatus(200);
                } else {
                    res.sendStatus(400);
                }
            } else {
                res.sendStatus(400);
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = UpdaterRouter;
