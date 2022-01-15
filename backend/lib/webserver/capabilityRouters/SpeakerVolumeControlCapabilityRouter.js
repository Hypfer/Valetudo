const CapabilityRouter = require("./CapabilityRouter");
const escapeHtml = require("escape-html");
const Logger = require("../../Logger");

class SpeakerVolumeControlCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    volume: await this.capability.getVolume()
                });
            } catch (e) {
                Logger.warn("Error while fetching speaker volume", e);
                res.status(500).json(e.message);
            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "set_volume") {
                    if (req.body.value === undefined) {
                        res.status(400).send("Missing value for set_volume");
                        return;
                    } else if (typeof req.body.value !== "number") {
                        res.status(400).send("Value for set_volume must be a number");
                        return;
                    }

                    try {
                        await this.capability.setVolume(req.body.value);

                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while setting speaker volume", e);
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send(`Invalid action "${escapeHtml(req.body.action)}" in request body`);
                }
            } else {
                res.status(400).send("Missing request body or missing action");
            }
        });
    }
}

module.exports = SpeakerVolumeControlCapabilityRouter;
