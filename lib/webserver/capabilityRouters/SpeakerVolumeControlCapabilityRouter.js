const Logger = require("../../Logger");
const CapabilityRouter = require("./CapabilityRouter");

class SpeakerVolumeControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json({
                muted: await this.capability.getSpeakerMute(),
                volume: await this.capability.getSpeakerVolumePercent()
            });
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                try {
                    switch (req.body.action) {
                        case "mute":
                            await this.capability.setSpeakerMute(true);
                            break;
                        case "unmute":
                            await this.capability.setSpeakerMute(false);
                            break;
                        case "set_volume":
                            if (req.body.value === undefined) {
                                res.status(400).send("Missing value for set_volume");
                                return;
                            } else if (typeof req.body.value !== "number") {
                                res.status(400).send("Value for set_volume must be a number");
                                return;
                            }
                            await this.capability.setSpeakerVolumePercent(req.body.value);
                            break;
                        case "test_speaker":
                            await this.capability.testSpeaker();
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