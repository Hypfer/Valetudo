const CapabilityRouter = require("./CapabilityRouter");

class WifiScanCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.scan());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });
    }
}

module.exports = WifiScanCapabilityRouter;
