const CapabilityRouter = require("./CapabilityRouter");

class SimpleToggleCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    enabled: await this.capability.isEnabled()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body) {
                try {
                    switch (req.body.action) {
                        case "enable":
                            await this.capability.enable();
                            break;
                        case "disable":
                            await this.capability.disable();
                            break;
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Invalid action");
                    }

                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.status(400).send("Missing parameters in request body");
            }
        });
    }
}

module.exports = SimpleToggleCapabilityRouter;
