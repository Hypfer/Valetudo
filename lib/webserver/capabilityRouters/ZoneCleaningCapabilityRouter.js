const Logger = require("../../Logger");
const CapabilityRouter = require("./CapabilityRouter");

const ValetudoZonePreset = require("../../entities/core/ValetudoZonePreset");
const ValetudoZone = require("../../entities/core/ValetudoZone");

class ZoneCleaningCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/presets", (req, res) => {
            res.json(this.capability.robot.config.get("zonePresets"));
        });

        this.router.get("/presets/:id", (req, res) => {
            const zone = this.capability.robot.config.get("zonePresets")[req.params.id];

            if (zone) {
                res.json(zone);
            } else {
                res.sendStatus(404);
            }
        });

        this.router.put("/presets/:id", async (req, res) => {
            const zone = this.capability.robot.config.get("zonePresets")[req.params.id];

            if (zone && req.body && req.body.action === "clean") {
                try {
                    await this.capability.start(zone.zones);
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while starting zone cleaning for preset " + req.params.id, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.sendStatus(404);
            }
        });

        this.router.delete("/presets/:id", (req, res) => {
            const zoneSettings = this.capability.robot.config.get("zonePresets");

            if (zoneSettings[req.params.id]) {
                delete(zoneSettings[req.params.id]);

                this.capability.robot.config.set("zonePresets", zoneSettings);

                res.sendStatus(200);
            } else {
                res.sendStatus(404);
            }
        });

        this.router.post("/presets", (req, res) => {
            if (req.body && req.body.name && Array.isArray(req.body.zones) && req.body.zones.length > 0) {
                try {
                    const zoneSettings = this.capability.robot.config.get("zonePresets");
                    const newPreset = new ValetudoZonePreset({
                        name: req.body.name,
                        id: req.body.id,
                        zones: req.body.zones.map(z => {
                            return new ValetudoZone({
                                points: z.points,
                                iterations: z.iterations
                            });
                        })
                    });

                    zoneSettings[newPreset.id] = newPreset;

                    this.capability.robot.config.set("zonePresets", zoneSettings);
                    res.sendStatus(201);
                } catch (e) {
                    Logger.warn("Error while saving new zone", req.body);
                    res.status(500).json(e.message);
                }

            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "clean" && Array.isArray(req.body.zones)) {
                    try {
                        await this.capability.start(req.body.zones.map(z => {
                            if (!(Array.isArray(z.points) && z.points.length > 0)) {
                                throw new Error("Invalid Zone");
                            }
                            return new ValetudoZone({
                                points: z.points,
                                iterations: z.iterations
                            });
                        }));
                        res.sendStatus(200);

                    } catch (e) {
                        Logger.warn("Error while starting zone cleaning", {
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

module.exports = ZoneCleaningCapabilityRouter;