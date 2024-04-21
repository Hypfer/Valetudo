const CapabilityRouter = require("./CapabilityRouter");

class AutoEmptyDockAutoEmptyIntervalControlCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    interval: await this.capability.getInterval()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.interval) {
                try {
                    await this.capability.setInterval(req.body.interval);

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

module.exports = AutoEmptyDockAutoEmptyIntervalControlCapabilityRouter;
