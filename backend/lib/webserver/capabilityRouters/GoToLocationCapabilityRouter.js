const CapabilityRouter = require("./CapabilityRouter");
const escapeHtml = require("escape-html");
const ValetudoGoToLocation = require("../../entities/core/ValetudoGoToLocation");

class GoToLocationCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "goto" && req.body.coordinates && req.body.coordinates.x !== undefined && req.body.coordinates.y !== undefined) {
                    try {
                        await this.capability.goTo(new ValetudoGoToLocation({
                            coordinates: req.body.coordinates
                        }));
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

module.exports = GoToLocationCapabilityRouter;
