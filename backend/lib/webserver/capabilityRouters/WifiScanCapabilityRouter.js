const CapabilityRouter = require("./CapabilityRouter");

class WifiScanCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.scan());
        });
    }
}

module.exports = WifiScanCapabilityRouter;
