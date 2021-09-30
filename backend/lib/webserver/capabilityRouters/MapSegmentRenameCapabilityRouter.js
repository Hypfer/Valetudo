const escapeHtml = require("escape-html");

const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

const ValetudoMapSegment = require("../../entities/core/ValetudoMapSegment");

class MapSegmentRenameCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                switch (req.body.action) {
                    case "rename_segment":
                        if ( req.body.segment_id && req.body.name) {
                            try {
                                await this.capability.renameSegment(
                                    new ValetudoMapSegment({id: req.body.segment_id}),
                                    req.body.name
                                );

                                res.sendStatus(200);
                            } catch (e) {
                                Logger.warn("Error while renaming segment", {
                                    body: req.body,
                                    e: e
                                });
                                res.status(500).json(e.message);
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

module.exports = MapSegmentRenameCapabilityRouter;
