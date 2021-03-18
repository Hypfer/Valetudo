const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class MapResetCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                try {
                    switch (req.body.action) {
                        case "reset":
                            await this.capability.reset();
                            break;
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Invalid action");
                    }

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while executing action \"" + req.body.action + "\" for MapResetCapability", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = MapResetCapabilityRouter;
