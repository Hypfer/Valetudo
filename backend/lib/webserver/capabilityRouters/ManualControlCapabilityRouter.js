const CapabilityRouter = require("./CapabilityRouter");
const escapeHtml = require("escape-html");

class ManualControlCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    enabled: await this.capability.manualControlActive()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                switch (req.body.action) {
                    case "enable":
                        try {
                            await this.capability.enableManualControl();
                            res.sendStatus(200);
                        } catch (e) {
                            this.sendErrorResponse(req, res, e);
                        }
                        break;
                    case "disable":
                        try {
                            await this.capability.disableManualControl();
                            res.sendStatus(200);
                        } catch (e) {
                            this.sendErrorResponse(req, res, e);
                        }
                        break;
                    case "move":
                        if (req.body.movementCommand) {
                            try {
                                await this.capability.manualControl(req.body.movementCommand);
                                res.sendStatus(200);
                            } catch (e) {
                                this.sendErrorResponse(req, res, e);
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
