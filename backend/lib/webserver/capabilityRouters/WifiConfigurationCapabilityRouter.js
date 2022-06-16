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
            if (req.body) {
                try {
                    await this.capability.setWifiConfiguration(new ValetudoWifiConfiguration(req.body));
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.status(400).send("Missing request body");
            }
        });
    }
}

module.exports = WifiConfigurationCapabilityRouter;
