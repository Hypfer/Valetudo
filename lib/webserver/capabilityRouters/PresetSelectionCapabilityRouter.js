const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class PresetSelectionCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/presets", (req, res) => {
            res.json(this.capability.getPresets());
        });

        this.router.put("/preset", async (req, res) => {
            if (req.body && req.body.name) {
                try {
                    await this.capability.selectPreset(req.body.name);
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while setting preset " + req.body.name, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing name in request body");
            }
        });
    }
}

module.exports = PresetSelectionCapabilityRouter;
