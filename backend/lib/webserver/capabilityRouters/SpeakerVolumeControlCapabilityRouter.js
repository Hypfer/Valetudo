const CapabilityRouter = require("./CapabilityRouter");

class SpeakerVolumeControlCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    volume: await this.capability.getVolume()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "set_volume") {
                if (typeof req.body.value !== "number") {
                    res.sendStatus(400);
                    return;
                }

                try {
                    await this.capability.setVolume(req.body.value);

                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.sendStatus(400);
            }
        });
    }
}

module.exports = SpeakerVolumeControlCapabilityRouter;
