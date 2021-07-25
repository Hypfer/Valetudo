const CapabilityRouter = require("./CapabilityRouter");
const Logger = require("../../Logger");

class PendingMapChangeHandlingCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    pending: await this.capability.hasPendingChange()
                });
            } catch (e) {
                res.status(500).send(e.message);
            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body) {
                try {
                    switch (req.body.action) {
                        case "accept":
                            await this.capability.acceptChange();
                            break;
                        case "reject":
                            await this.capability.rejectChange();
                            break;
                        default:
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Invalid action");
                    }

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while committing map change", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing parameters in request body");
            }
        });
    }
}

module.exports = PendingMapChangeHandlingCapabilityRouter;
