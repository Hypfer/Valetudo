const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class LEDControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getLEDs());
        });

        this.router.put("/:type/:sub_type?", async (req, res) => {
            if (req.body && req.body.action) {
                try {
                    if (req.body.action === "toggle") {
                        await this.capability.toggleLED(req.params.type, req.params.subType);
                    } else {
                        await this.capability.setLED(req.body.action, req.params.type, req.params.subType);
                    }
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while setting LED " + req.params.type + " " + req.params.subType + " action " + req.body.action, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = LEDControlCapabilityRouter;