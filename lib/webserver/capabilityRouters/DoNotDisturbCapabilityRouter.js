const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");
const ValetudoDNDConfiguration = require("../../entities/core/ValetudoDNDConfiguration");

class DoNotDisturbCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/DoNotDisturbCapability:
         *   get:
         *     tags:
         *       - DoNotDisturbCapability
         *     summary: Get do-not-disturb configuration
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               $ref: "#/components/schemas/ValetudoDNDConfiguration"
         */
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getDndConfiguration());
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/DoNotDisturbCapability:
         *   put:
         *     tags:
         *       - DoNotDisturbCapability
         *     summary: Set do-not-disturb configuration
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             $ref: "#/components/schemas/ValetudoDNDConfiguration"
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.start && req.body.end) {
                try {
                    await this.capability.setDndConfiguration(new ValetudoDNDConfiguration(req.body));

                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while configuring do not disturb setting", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing parameters in request body");
            }
        });
    }
}

module.exports = DoNotDisturbCapabilityRouter;
