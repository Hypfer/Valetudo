const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

const ValetudoMapSegment = require("../../entities/core/ValetudoMapSegment");

class MapSegmentEditCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/MapSegmentEditCapability:
         *   put:
         *     tags:
         *       - MapSegmentEditCapability
         *     summary: Edit map segments
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             allOf:
         *               - type: object
         *                 properties:
         *                   action:
         *                     type: string
         *                     enum:
         *                       - join_segments
         *                       - split_segment
         *             oneOf:
         *               - type: object
         *                 description: "Provide if action is `join_segments`"
         *                 properties:
         *                   segment_a_id:
         *                     type: string
         *                   segment_b_id:
         *                     type: string
         *               - type: object
         *                 description: "Provide if action is `split_segment`"
         *                 properties:
         *                   segment_id:
         *                     type: string
         *                   pA:
         *                     $ref: "#/components/schemas/CoordinateDTO"
         *                   pB:
         *                     $ref: "#/components/schemas/CoordinateDTO"
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
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
                                Logger.warn("Error while joining segments", {
                                    body: req.body,
                                    e: e
                                });
                                res.status(500).json(e.message);
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
                                Logger.warn("Error while splitting segment", {
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
                        res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = MapSegmentEditCapabilityRouter;
