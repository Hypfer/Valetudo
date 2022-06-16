const CapabilityRouter = require("./CapabilityRouter");

class PendingMapChangeHandlingCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    pending: await this.capability.hasPendingChange()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
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
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.sendStatus(400);
            }
        });
    }
}

module.exports = PendingMapChangeHandlingCapabilityRouter;
