const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class CarpetModeControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    enabled: await this.capability.isEnabled()
                });
            } catch (e) {
                res.status(500).send(e.message);
            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body) {
                try {
                    switch (req.body.action) {
                        case "enable":
                            await this.capability.enable(true);
                            break;
                        case "disable":
                            await this.capability.disable(false);
                            break;
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Invalid action");
                    }

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while configuring carpet mode setting", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing parameters in request body");
            }
        });
    }
}

module.exports = CarpetModeControlCapabilityRouter;
