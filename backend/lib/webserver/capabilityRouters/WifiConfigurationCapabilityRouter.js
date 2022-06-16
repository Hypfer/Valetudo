const CapabilityRouter = require("./CapabilityRouter");
const ValetudoWifiConfiguration = require("../../entities/core/ValetudoWifiConfiguration");

class WifiConfigurationCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getWifiStatus());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            try {
                await this.capability.setWifiConfiguration(new ValetudoWifiConfiguration(req.body));
                res.sendStatus(200);
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });
    }
}

module.exports = WifiConfigurationCapabilityRouter;
