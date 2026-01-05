const CapabilityRouter = require("./CapabilityRouter");

class AutoEmptyDockAutoEmptyDurationControlCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    duration: await this.capability.getDuration()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.duration) {
                try {
                    await this.capability.setDuration(req.body.duration);

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

module.exports = AutoEmptyDockAutoEmptyDurationControlCapabilityRouter;
