const CapabilityRouter = require("./CapabilityRouter");
const escapeHtml = require("escape-html");

class MapResetCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "reset") {
                    try {
                        await this.capability.reset();
                        res.sendStatus(200);
                    } catch (e) {
                        this.sendErrorResponse(req, res, e);
                    }
                } else {
                    res.status(400).send(`Invalid action "${escapeHtml(req.body.action)}" in request body`);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = MapResetCapabilityRouter;
