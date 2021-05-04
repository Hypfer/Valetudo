const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class PresetSelectionCapabilityRouter extends CapabilityRouter {

    initRoutes() {

        /**
         * @swagger
         * /api/v2/robot/capabilities/{presetCapability}/presets:
         *   get:
         *     tags:
         *       - PresetSelectionCapability
         *     summary: Get available presets
         *     parameters:
         *       - $ref: "#/components/parameters/presetCapability"
         *     responses:
         *       200:
         *         description: Ok
         *         content:
         *           application/json:
         *             schema:
         *               type: array
         *               items:
         *                 type: string
         */
        this.router.get("/presets", (req, res) => {
            res.json(this.capability.getPresets());
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/{presetCapability}/preset:
         *   put:
         *     tags:
         *       - PresetSelectionCapability
         *     summary: Set preset value
         *     parameters:
         *       - $ref: "#/components/parameters/presetCapability"
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               name:
         *                 type: string
         *                 description: "Preset name retrieved from the same capability"
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/preset", async (req, res) => {
            if (req.body && req.body.name) {
                try {
                    await this.capability.selectPreset(req.body.name);
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while setting preset " + req.body.name, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing name in request body");
            }
        });
    }
}

module.exports = PresetSelectionCapabilityRouter;
