const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class AutoEmptyDockManualTriggerCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action === "trigger") {
                try {
                    await this.capability.triggerAutoEmpty();
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while triggering auto empty", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing or invalid request body");
            }
        });
    }
}

module.exports = AutoEmptyDockManualTriggerCapabilityRouter;
