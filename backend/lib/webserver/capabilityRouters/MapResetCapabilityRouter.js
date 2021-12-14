const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");
const escapeHtml = require("escape-html");

class MapResetCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "reset") {
                    try {
                        await this.capability.reset();
                    } catch (e) {
                        Logger.warn("Error while executing MapResetCapability", e);
                        res.status(500).json(e.message);
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
