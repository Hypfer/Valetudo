const CapabilityRouter = require("./CapabilityRouter");
const ValetudoGoToLocation = require("../../entities/core/ValetudoGoToLocation");

class GoToLocationCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "goto" && req.body.coordinates !== undefined) {
                try {
                    await this.capability.goTo(new ValetudoGoToLocation({
                        coordinates: req.body.coordinates
                    }));
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.status(400).send("Invalid action in request body");
            }
        });
    }
}

module.exports = GoToLocationCapabilityRouter;
