const CapabilityRouter = require("./CapabilityRouter");
const Logger = require("../../Logger");

const ValetudoGoToLocation = require("../../entities/core/ValetudoGoToLocation");

class GoToLocationCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/presets", (req, res) => {
            res.json(this.capability.robot.config.get("goToLocationPresets"));
        });

        this.router.get("/presets/:id", (req, res) => {
            const locationPreset = this.capability.robot.config.get("goToLocationPresets")[req.params.id];

            if (locationPreset) {
                res.json(locationPreset);
            } else {
                res.sendStatus(404);
            }
        });

        this.router.put("/presets/:id", async (req, res) => {
            const locationPreset = this.capability.robot.config.get("goToLocationPresets")[req.params.id];

            if (locationPreset && req.body && req.body.action === "goto") {
                try {
                    await this.capability.goTo(locationPreset);
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while going to goToLocationPreset for preset " + req.params.id, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.sendStatus(404);
            }
        });

        this.router.delete("/presets/:id", (req, res) => {
            const goToLocationPresets = this.capability.robot.config.get("goToLocationPresets");

            if (goToLocationPresets[req.params.id]) {
                delete(goToLocationPresets[req.params.id]);

                this.capability.robot.config.set("goToLocationPresets", goToLocationPresets);

                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        });

        this.router.post("/presets/:id", (req, res) => {
            const goToLocationPresets = this.capability.robot.config.get("goToLocationPresets");

            if (goToLocationPresets[req.params.id]) {
                if (req.body && req.body.name && req.body.coordinates && req.body.coordinates.x !== undefined && req.body.coordinates.y !== undefined) {
                    try {
                        const newPreset = new ValetudoGoToLocation({
                            name: req.body.name,
                            id: req.params.id,
                            coordinates: req.body.coordinates
                        });

                        goToLocationPresets[newPreset.id] = newPreset;

                        this.capability.robot.config.set("goToLocationPresets", goToLocationPresets);
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while saving goToLocationPreset", req.body);
                        res.status(500).json(e.message);
                    }

                }
            } else {
                res.sendStatus(404);
            }
        });

        this.router.post("/presets", (req, res) => {
            if (req.body && req.body.name && req.body.coordinates && req.body.coordinates.x !== undefined && req.body.coordinates.y !== undefined) {
                try {
                    const goToLocationPresets = this.capability.robot.config.get("goToLocationPresets");
                    const newPreset = new ValetudoGoToLocation({
                        name: req.body.name,
                        id: req.body.id,
                        coordinates: req.body.coordinates
                    });

                    goToLocationPresets[newPreset.id] = newPreset;

                    this.capability.robot.config.set("goToLocationPresets", goToLocationPresets);
                    res.sendStatus(201);
                } catch (e) {
                    Logger.warn("Error while saving new goToLocationPreset", req.body);
                    res.status(500).json(e.message);
                }

            } else {
                res.sendStatus(400);
            }
        });

        //TODO: Remove this after building a new webinterface

        this.router.get("/presets_legacy", (req, res) => {
            const presetsFromConfig = Object.values(this.capability.robot.config.get("goToLocationPresets"));

            res.json(presetsFromConfig.map(preset => {
                return {
                    name: preset.name,
                    id: preset.id,
                    coordinates: [preset.coordinates.x, preset.coordinates.y]
                };
            }));
        });


        this.router.post("/presets_legacy", (req, res) => {
            if (Array.isArray(req.body)) {
                const valid = req.body.every(p => {
                    return p && p.name && Array.isArray(p.coordinates);
                });

                if (valid) {
                    const presetsArr = req.body.map(preset => {
                        return new ValetudoGoToLocation({
                            name: preset.name,
                            id: preset.id,
                            coordinates: {
                                x: preset.coordinates[0],
                                y: preset.coordinates[1]
                            }
                        });
                    });

                    const presets = {};

                    presetsArr.forEach(z => {
                        presets[z.id] = z;
                    });


                    this.capability.robot.config.set("goToLocationPresets", presets);
                    res.sendStatus(201);
                } else {
                    res.sendStatus(400);
                }
            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "goto" && req.body.coordinates && req.body.coordinates.x !== undefined && req.body.coordinates.y !== undefined) {
                    try {
                        await this.capability.goTo(new ValetudoGoToLocation({
                            name: "dynamic",
                            coordinates: req.body.coordinates
                        }));
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while starting goTo coordinates", {
                            body: req.body,
                            e: e
                        });
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = GoToLocationCapabilityRouter;
