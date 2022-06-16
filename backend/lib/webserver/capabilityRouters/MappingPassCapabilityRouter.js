const CapabilityRouter = require("./CapabilityRouter");

class MappingPassCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action === "start_mapping") {
                try {
                    await this.capability.startMapping();
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.status(400).send("Missing or invalid request body");
            }
        });
    }
}

module.exports = MappingPassCapabilityRouter;
