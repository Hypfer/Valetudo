const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");
const ValetudoCarpetModeConfiguration = require("../../entities/core/ValetudoCarpetModeConfiguration");

class CarpetModeControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getCarpetMode());
        });

        this.router.put("/", async (req, res) => {
            if (req.body) {
                try {
                    await this.capability.setCarpetMode(new ValetudoCarpetModeConfiguration(req.body));

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while configuring carpet mode setting", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing parameters in request body");
            }
        });
    }
}

module.exports = CarpetModeControlCapabilityRouter;