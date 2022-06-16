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

        this.router.put("/", this.validator, async (req, res) => {
            const method = methodMap[req.body.action];

            if (method) {
                try {
                    await method();
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.status(400).send("Invalid action in request body");
            }
        });
    }
}

module.exports = BasicControlCapabilityRouter;
