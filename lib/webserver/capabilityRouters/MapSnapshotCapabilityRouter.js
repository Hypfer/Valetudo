const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");
const ValetudoMapSnapshot = require("../../entities/core/ValetudoMapSnapshot");

class MapSnapshotCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/MapSnapshotCapability:
         *   get:
         *     tags:
         *       - MapSnapshotCapability
         *     summary: Get map snapshots
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 $ref: "#/components/schemas/ValetudoMapSnapshot"
         */
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getSnapshots());
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/MapSnapshotCapability:
         *   put:
         *     tags:
         *       - MapSnapshotCapability
         *     summary: Restore map snapshot
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - restore
         *               id:
         *                 type: string
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action === "restore" && req.body.id) {
                try {
                    await this.capability.restoreSnapshot(new ValetudoMapSnapshot({id: req.body.id}));
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while restoring map snapshot", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing or invalid request body");
            }
        });
    }
}

module.exports = MapSnapshotCapabilityRouter;
