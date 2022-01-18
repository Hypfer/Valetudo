const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");
const ValetudoWifiConfiguration = require("../../entities/core/ValetudoWifiConfiguration");

class WifiConfigurationCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getWifiStatus());
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body) {
                try {
                    await this.capability.setWifiConfiguration(new ValetudoWifiConfiguration(req.body));
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while setting wifi configuration", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing request body");
            }
        });
    }
}

module.exports = WifiConfigurationCapabilityRouter;
