const CapabilityRouter = require("./CapabilityRouter");

class MopDockMopWashTemperatureControlCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    temperature: await this.capability.getTemperature()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.temperature) {
                try {
                    await this.capability.setTemperature(req.body.temperature);

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

module.exports = MopDockMopWashTemperatureControlCapabilityRouter;
