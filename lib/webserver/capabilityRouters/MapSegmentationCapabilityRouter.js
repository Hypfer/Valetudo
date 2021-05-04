const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

const ValetudoMapSegment = require("../../entities/core/ValetudoMapSegment");

class MapSegmentationCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/MapSegmentationCapability:
         *   get:
         *     tags:
         *       - MapSegmentationCapability
         *     summary: Get available map segments
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 $ref: "#/components/schemas/ValetudoMapSegment"
         */
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getSegments());
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/MapSegmentationCapability:
         *   put:
         *     tags:
         *       - MapSegmentationCapability
         *     summary: Clean map segments
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - start_segment_action
         *               segment_ids:
         *                 type: array
         *                 items:
         *                   type: string
         *                   description: "Segment IDs to clean"
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                switch (req.body.action) {
                    case "start_segment_action":
                        if (Array.isArray(req.body.segment_ids)) {
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
