const CapabilityRouter = require("./CapabilityRouter");
const escapeHtml = require("escape-html");
const ValetudoZone = require("../../entities/core/ValetudoZone");

class ZoneCleaningCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "clean" && Array.isArray(req.body.zones)) {
                    try {
                        await this.capability.start(req.body.zones.map(z => {
                            if (!(z.points)) {
                                throw new Error("Invalid Zone");
                            }

                            return new ValetudoZone({
                                points: z.points,
                                iterations: z.iterations
                            });
                        }));
                        res.sendStatus(200);

                    } catch (e) {
                        this.sendErrorResponse(req, res, e);
                    }
                } else {
                    res.status(400).send(`Invalid action "${escapeHtml(req.body.action)}" in request body`);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = ZoneCleaningCapabilityRouter;
