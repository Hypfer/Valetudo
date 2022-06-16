const CapabilityRouter = require("./CapabilityRouter");

class MappingPassCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "start_mapping") {
                try {
                    await this.capability.startMapping();
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

module.exports = MappingPassCapabilityRouter;
