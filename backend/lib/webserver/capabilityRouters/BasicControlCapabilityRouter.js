const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class BasicControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        const methodMap = {
            "start": () => {
                return this.capability.start();
            },
            "stop": () => {
                return this.capability.stop();
            },
            "pause": () => {
                return this.capability.pause();
            },
            "home": () => {
                return this.capability.home();
            }
        };

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                const method = methodMap[req.body.action];

                if (method) {
                    try {
                        await method();
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while calling BasicControlCapability Action " + req.body.action, e);
                        res.status(500).json(e);
                    }
                } else {
                    res.status(400).send("Invalid action in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = BasicControlCapabilityRouter;
