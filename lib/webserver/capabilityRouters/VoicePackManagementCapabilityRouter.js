const CapabilityRouter = require("./CapabilityRouter");

class VoicePackManagementCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json({
                "currentLanguage": await this.capability.getCurrentVoiceLanguage(),
                "operationStatus": await this.capability.getVoicePackOperationStatus()
            });
        });

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