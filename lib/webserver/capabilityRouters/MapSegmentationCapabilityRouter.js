const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

const ValetudoMapSegment = require("../../entities/core/ValetudoMapSegment");

class MapSegmentationCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getSegments());
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "start_segment_action" && Array.isArray(req.body.segment_ids)) {
                    try {
                        await this.capability.executeSegmentAction(req.body.segment_ids.map(sid => {
                            return new ValetudoMapSegment({
                                id: sid
                            });
                        }));

                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while starting segment cleaning", {
                            body: req.body,
                            e: e
                        });
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = MapSegmentationCapabilityRouter;
