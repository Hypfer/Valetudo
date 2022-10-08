const CapabilityRouter = require("./CapabilityRouter");

class MopDockDryManualTriggerCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        const methodMap = {
            "start": () => {
                return this.capability.startDrying();
            },
            "stop": () => {
                return this.capability.stopDrying();
            },
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
                res.sendStatus(400);
            }
        });
    }
}

module.exports = MopDockDryManualTriggerCapabilityRouter;
