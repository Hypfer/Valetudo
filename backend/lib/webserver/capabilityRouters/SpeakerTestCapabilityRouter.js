const CapabilityRouter = require("./CapabilityRouter");

class SpeakerTestCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "play_test_sound") {
                try {
                    await this.capability.playTestSound();
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.status(400).send("Invalid action in request body");
            }
        });
    }
}

module.exports = SpeakerTestCapabilityRouter;
