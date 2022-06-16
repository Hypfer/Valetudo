const CapabilityRouter = require("./CapabilityRouter");

class PresetSelectionCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/presets", (req, res) => {
            try {
                res.json(this.capability.getPresets());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/preset", this.validator, async (req, res) => {
            if (req.body && req.body.name) {
                try {
                    await this.capability.selectPreset(req.body.name);
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.status(400).send("Missing name in request body");
            }
        });
    }
}

module.exports = PresetSelectionCapabilityRouter;
