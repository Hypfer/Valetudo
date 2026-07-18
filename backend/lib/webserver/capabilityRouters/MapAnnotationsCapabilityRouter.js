const CapabilityRouter = require("./CapabilityRouter");
const ValetudoMapAnnotation = require("../../entities/core/ValetudoMapAnnotation");

class MapAnnotationsCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (!Array.isArray(req.body)) {
                return res.sendStatus(400);
            }

            const mapAnnotations = [];
            for (const rawAnnotation of req.body) {
                mapAnnotations.push(new ValetudoMapAnnotation({
                    type: rawAnnotation.type,
                    points: rawAnnotation.points.map(p => ({ x: p.x, y: p.y }))
                }));
            }

            try {
                await this.capability.setMapAnnotations(mapAnnotations);
                res.sendStatus(200);
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });
    }
}

module.exports = MapAnnotationsCapabilityRouter;
