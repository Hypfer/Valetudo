const CapabilityRouter = require("./CapabilityRouter");
const ValetudoMapSegment = require("../../entities/core/ValetudoMapSegment");

class MapSegmentationCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getSegments());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "start_segment_action") {
                if (Array.isArray(req.body.segment_ids)) {
                    try {
                        const options = {};

                        if (typeof req.body.iterations === "number") {
                            options.iterations = req.body.iterations;
                        }

                        if (req.body.customOrder === true) {
                            options.customOrder = true;
                        }

                        await this.capability.executeSegmentAction(req.body.segment_ids.map(sid => {
                            return new ValetudoMapSegment({
                                id: sid
                            });
                        }), options);

                        res.sendStatus(200);
                    } catch (e) {
                        this.sendErrorResponse(req, res, e);
                    }
                } else {
                    res.sendStatus(400);
                }
            } else {
                res.sendStatus(400);
            }
        });
    }
}

module.exports = MapSegmentationCapabilityRouter;
