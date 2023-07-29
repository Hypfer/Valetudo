const CapabilityRouter = require("./CapabilityRouter");

class CarpetSensorModeControlCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    mode: await this.capability.getMode()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.mode) {
                try {
                    await this.capability.setMode(req.body.mode);

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

module.exports = CarpetSensorModeControlCapabilityRouter;
