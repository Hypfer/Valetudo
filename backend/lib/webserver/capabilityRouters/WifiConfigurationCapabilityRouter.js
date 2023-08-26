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
                let typeSpecificSettings;

                switch (req.body.credentials.type) {
                    case ValetudoWifiConfiguration.CREDENTIALS_TYPE.WPA2_PSK:
                        typeSpecificSettings = {
                            password: req.body.credentials.typeSpecificSettings.password
                        };
                        break;
                    default:
                        typeSpecificSettings = {};
                }

                await this.capability.setWifiConfiguration(new ValetudoWifiConfiguration({
                    ssid: req.body.ssid,
                    credentials: {
                        type: req.body.credentials.type,
                        typeSpecificSettings: typeSpecificSettings
                    },
                    metaData: {
                        force: req.body.metaData?.force === true
                    }
                }));

                res.sendStatus(200);
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });
    }
}

module.exports = WifiConfigurationCapabilityRouter;
