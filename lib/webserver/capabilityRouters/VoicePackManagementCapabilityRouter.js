const CapabilityRouter = require("./CapabilityRouter");

class VoicePackManagementCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/VoicePackManagementCapability:
         *   get:
         *     tags:
         *       - VoicePackManagementCapability
         *     summary: Get current voice pack and operation status, if any
         *     responses:
         *       200:
         *          description: Ok
         *          content:
         *            application/json:
         *              schema:
         *                type: object
         *                properties:
         *                  currentLanguage:
         *                    type: string
         *                  operationStatus:
         *                    $ref: "#/components/schemas/ValetudoVoicePackOperationStatus"
         */
        this.router.get("/", async (req, res) => {
            res.json({
                "currentLanguage": await this.capability.getCurrentVoiceLanguage(),
                "operationStatus": await this.capability.getVoicePackOperationStatus()
            });
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/VoicePackManagementCapability:
         *   put:
         *     tags:
         *       - VoicePackManagementCapability
         *     summary: Set voice pack
         *     description: |
         *       **Note:** the actual parameters and the voice pack format are highly dependent on the specific robot
         *       model.
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - download
         *               url:
         *                 type: string
         *               language:
         *                 type: string
         *               hash:
         *                 type: string
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action === "download" && req.body.url) {
                try {
                    await this.capability.downloadVoicePack({
                        url: req.body.url,
                        language: req.body.language,
                        hash: req.body.hash
                    });
                    res.sendStatus(200);
                } catch (e) {
                    res.status(500).send(e.message);
                }
            } else {
                res.status(400).send("Invalid request");
            }
        });
    }
}

module.exports = VoicePackManagementCapabilityRouter;
