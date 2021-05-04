const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class ConsumableMonitoringCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/ConsumableMonitoringCapability:
         *   get:
         *     tags:
         *       - ConsumableMonitoringCapability
         *     summary: Get consumables status
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 $ref: "#/components/schemas/ConsumableStateAttribute"
         */
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getConsumables());
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/ConsumableMonitoringCapability/{type}/{subType}:
         *   put:
         *     tags:
         *       - ConsumableMonitoringCapability
         *     summary: Reset consumable
         *     parameters:
         *       - in: path
         *         name: type
         *         description: Consumable type
         *         required: true
         *         schema:
         *           type: string
         *       - in: path
         *         name: subType
         *         description: Consumable sub-type
         *         required: true
         *         schema:
         *           type: string
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - reset
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/:type/:sub_type?", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "reset") {
                    try {
                        await this.capability.resetConsumable(req.params.type, req.params.sub_type);
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while resetting consumable " + req.params.type + " " + req.params.sub_type, e);
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

module.exports = ConsumableMonitoringCapabilityRouter;
