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
                switch (req.body.action) {
                    case "start_segment_action":
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
                                Logger.warn("Error while starting segment cleaning", {
                                    body: req.body,
                                    e: e
                                });
                                res.status(500).json(e.message);
                            }
                        } else {
                            res.status(400).send("Missing segment_ids");
                        }
                        break;
                    default:
                        res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = MapSegmentationCapabilityRouter;
