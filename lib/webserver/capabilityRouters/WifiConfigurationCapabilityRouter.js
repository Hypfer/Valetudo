const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");
const ValetudoWifiConfiguration = require("../../entities/core/ValetudoWifiConfiguration");

class WifiConfigurationCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/WifiConfigurationCapability:
         *   get:
         *     tags:
         *       - WifiConfigurationCapability
         *     summary: Get current wireless radio configuration
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               $ref: "#/components/schemas/ValetudoWifiConfiguration"
         */
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getWifiConfiguration());
        });

        this.router.put("/", async (req, res) => {
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
