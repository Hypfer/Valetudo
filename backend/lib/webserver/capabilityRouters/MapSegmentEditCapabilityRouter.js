const CapabilityRouter = require("./CapabilityRouter");
const escapeHtml = require("escape-html");
const ValetudoMapSegment = require("../../entities/core/ValetudoMapSegment");

class MapSegmentEditCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                switch (req.body.action) {
                    case "join_segments":
                        if (req.body.segment_a_id && req.body.segment_b_id) {
                            try {
                                await this.capability.joinSegments(
                                    new ValetudoMapSegment({id: req.body.segment_a_id}),
                                    new ValetudoMapSegment({id: req.body.segment_b_id}),
                                );

                                res.sendStatus(200);
                            } catch (e) {
                                this.sendErrorResponse(req, res, e);
                            }
                        } else {
                            res.status(400).send("Invalid request");
                        }
                        break;
                    case "split_segment":
                        if (req.body.pA && req.body.pB && req.body.segment_id) {
                            try {
                                await this.capability.splitSegment(
                                    new ValetudoMapSegment({id: req.body.segment_id}),
                                    req.body.pA,
                                    req.body.pB
                                );

                                res.sendStatus(200);
                            } catch (e) {
                                this.sendErrorResponse(req, res, e);
                            }
                        } else {
                            res.status(400).send("Invalid request");
                        }
                        break;
                    default:
                        res.status(400).send(`Invalid action "${escapeHtml(req.body.action)}" in request body`);
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = MapSegmentEditCapabilityRouter;
