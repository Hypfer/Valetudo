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
            if (req.body.name) {
                try {
                    await this.capability.selectPreset(req.body.name);
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.sendStatus(400);
            }
        });
    }
}

module.exports = PresetSelectionCapabilityRouter;
