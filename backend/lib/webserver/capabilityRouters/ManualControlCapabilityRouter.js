const escapeHtml = require("escape-html");

const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class ManualControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json({
                enabled: await this.capability.manualControlActive()
            });
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                switch (req.body.action) {
                    case "enable":
                        try {
                            await this.capability.enableManualControl();
                            res.sendStatus(200);
                        } catch (e) {
                            Logger.warn("Failed to enable manual control", e);
                            res.status(500).json(e.message);
                        }
                        break;
                    case "disable":
                        try {
                            await this.capability.disableManualControl();
                            res.sendStatus(200);
                        } catch (e) {
                            Logger.warn("Failed to disable manual control", e);
                            res.status(500).json(e.message);
                        }
                        break;
                    case "move":
                        if (req.body.movementCommand) {
                            try {
                                await this.capability.manualControl(req.body.movementCommand);
                                res.sendStatus(200);
                            } catch (e) {
                                Logger.warn("Error while performing manual control movement command " + req.body.movementCommand, e);
                                res.status(500).json(e.message);
                            }
                        } else {
                            res.status(400).send("Missing movementCommand in request body");
                        }
                        break;
                    default:
                        res.status(400).send(`Invalid action "${escapeHtml(req.body.action)}" in request body`);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = ManualControlCapabilityRouter;
