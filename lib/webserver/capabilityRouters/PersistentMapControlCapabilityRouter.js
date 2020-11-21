const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class PersistentMapControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json({
                enabled: await this.capability.isEnabled()
            });
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                try {
                    switch (req.body.action) {
                        case "reset":
                            await this.capability.reset();
                            break;
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
                    Logger.warn("Error while executing action \"" + req.body.action + "\" for PersistentMapControlCapability", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = PersistentMapControlCapabilityRouter;