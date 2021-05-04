const CapabilityRouter = require("./CapabilityRouter");
const Logger = require("../../Logger");

class SpeakerVolumeControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        /**
         * @swagger
         * /api/v2/robot/capabilities/SpeakerVolumeControlCapability:
         *   get:
         *     tags:
         *       - SpeakerVolumeControlCapability
         *     summary: Get speaker volume
         *     responses:
         *       200:
         *          description: Ok
         *          content:
         *            application/json:
         *              schema:
         *                type: object
         *                properties:
         *                  volume:
         *                    type: number
         *                    description: "Percentage"
         */
        this.router.get("/", async (req, res) => {
            res.json({
                volume: await this.capability.getVolume()
            });
        });

        /**
         * @swagger
         * /api/v2/robot/capabilities/SpeakerVolumeControlCapability:
         *   put:
         *     tags:
         *       - SpeakerVolumeControlCapability
         *     summary: Set speaker volume
         *     requestBody:
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               action:
         *                 type: string
         *                 enum:
         *                   - set_volume
         *               value:
         *                 type: number
         *                 description: "Percentage"
         *     responses:
         *       200:
         *         $ref: "#/components/responses/200"
         *       400:
         *         $ref: "#/components/responses/400"
         */
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                try {
                    switch (req.body.action) {
                        case "set_volume":
                            if (req.body.value === undefined) {
                                res.status(400).send("Missing value for set_volume");
                                return;
                            } else if (typeof req.body.value !== "number") {
                                res.status(400).send("Value for set_volume must be a number");
                                return;
                            }
                            await this.capability.setVolume(req.body.value);
                            break;
                        default:
                            res.status(400).send("Invalid action");
                            return;
                    }
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while setting speaker volume", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing request body or missing action");
            }
        });
    }
}

module.exports = SpeakerVolumeControlCapabilityRouter;
