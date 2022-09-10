const CapabilityRouter = require("./CapabilityRouter");
const ValetudoDNDConfiguration = require("../../entities/core/ValetudoDNDConfiguration");

class DoNotDisturbCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getDndConfiguration());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.start && req.body.end) {
                try {
                    await this.capability.setDndConfiguration(new ValetudoDNDConfiguration({
                        enabled: req.body.enabled,
                        start: {
                            hour: req.body.start.hour,
                            minute: req.body.start.minute,
                        },
                        end: {
                            hour: req.body.end.hour,
                            minute: req.body.end.minute,
                        }
                    }));

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

module.exports = DoNotDisturbCapabilityRouter;
