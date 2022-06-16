const CapabilityRouter = require("./CapabilityRouter");

class AutoEmptyDockManualTriggerCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "trigger") {
                try {
                    await this.capability.triggerAutoEmpty();
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

module.exports = AutoEmptyDockManualTriggerCapabilityRouter;
