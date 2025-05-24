const CapabilityRouter = require("./CapabilityRouter");
const ValetudoManualMovementVector = require("../../entities/core/ValetudoManualMovementVector");

class HighResolutionManualControlCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    enabled: await this.capability.manualControlActive()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            switch (req.body.action) {
                case "enable":
                    try {
                        await this.capability.enableManualControl();
                        res.sendStatus(200);
                    } catch (e) {
                        this.sendErrorResponse(req, res, e);
                    }
                    break;
                case "disable":
                    try {
                        await this.capability.disableManualControl();
                        res.sendStatus(200);
                    } catch (e) {
                        this.sendErrorResponse(req, res, e);
                    }
                    break;
                case "move":
                    if (
                        req.body.vector !== undefined &&
                        typeof req.body.vector.velocity === "number" &&
                        typeof req.body.vector.angle === "number"
                    ) {
                        try {
                            await this.capability.manualControl(new ValetudoManualMovementVector({
                                velocity: req.body.vector.velocity,
                                angle: req.body.vector.angle
                            }));

                            res.sendStatus(200);
                        } catch (e) {
                            this.sendErrorResponse(req, res, e);
                        }
                    } else {
                        res.sendStatus(400);
                    }
                    break;
                default:
                    res.sendStatus(400);
            }
        });
    }
}

module.exports = HighResolutionManualControlCapabilityRouter;
