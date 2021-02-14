const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class SpeakerTestCapabilityRouter extends CapabilityRouter {

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
