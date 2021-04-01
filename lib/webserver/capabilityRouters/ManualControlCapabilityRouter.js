const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class ManualControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.put("/enter", async (req, res) => {
            try {
                await this.capability.enterManualControl();
                res.sendStatus(200);
            } catch (e) {
                Logger.warn("Unable to enter manual control", e);
                res.status(500).json(e.message);
            }
        });

        this.router.put("/leave", async (req, res) => {
            try {
                await this.capability.leaveManualControl();
                res.sendStatus(200);
            } catch (e) {
                Logger.warn("Unable to leave manual control", e);
                res.status(500).json(e.message);
            }
        });

        this.router.put("/control", async (req, res) => {
            if (req.body && req.body.action) {
                try {
                    // Duration is optional, default is controlled by implementations
                    await this.capability.manualControl(req.body.action);
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while performing manual control action " + req.body.action, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = ManualControlCapabilityRouter;
