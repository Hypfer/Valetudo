const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class ConsumableMonitoringCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getConsumables());
        });

        this.router.put("/:type/:sub_type?", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "reset") {
                    try {
                        await this.capability.resetConsumable(req.params.type, req.params.sub_type);
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while resetting consumable " + req.params.type + " " + req.params.sub_type, e);
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = ConsumableMonitoringCapabilityRouter;
