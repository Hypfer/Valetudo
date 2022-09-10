const CapabilityRouter = require("./CapabilityRouter");
const ValetudoZone = require("../../entities/core/ValetudoZone");

class ZoneCleaningCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "clean" && Array.isArray(req.body.zones)) {
                try {
                    await this.capability.start(req.body.zones.map(z => {
                        if (!(z.points)) {
                            throw new Error("Invalid Zone");
                        }

                        return new ValetudoZone({
                            points: {
                                pA: {
                                    x: z.points.pA?.x,
                                    y: z.points.pA?.y,
                                },
                                pB: {
                                    x: z.points.pB?.x,
                                    y: z.points.pB?.y,
                                },
                                pC: {
                                    x: z.points.pC?.x,
                                    y: z.points.pC?.y,
                                },
                                pD: {
                                    x: z.points.pD?.x,
                                    y: z.points.pD?.y,
                                },
                            },
                            iterations: z.iterations
                        });
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

module.exports = ZoneCleaningCapabilityRouter;
