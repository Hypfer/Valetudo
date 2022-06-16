const CapabilityRouter = require("./CapabilityRouter");

class LocateCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "locate") {
                try {
                    await this.capability.locate();
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

module.exports = LocateCapabilityRouter;
