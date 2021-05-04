const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class SpeakerTestCapabilityRouter extends CapabilityRouter {
    /**
     * @swagger
     * /api/v2/robot/capabilities/SpeakerTestCapability:
     *   put:
     *     tags:
     *       - SpeakerTestCapability
     *     summary: Test speaker
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               action:
     *                 type: string
     *                 enum:
     *                   - play_test_sound
     *     responses:
     *       200:
     *         $ref: "#/components/responses/200"
     *       400:
     *         $ref: "#/components/responses/400"
     */
    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action === "play_test_sound") {
                try {
                    await this.capability.playTestSound();
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while playing speaker test sound", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing or invalid request body");
            }
        });
    }
}

module.exports = SpeakerTestCapabilityRouter;
