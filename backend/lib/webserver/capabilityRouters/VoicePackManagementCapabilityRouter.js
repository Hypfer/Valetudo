const CapabilityRouter = require("./CapabilityRouter");

class VoicePackManagementCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json({
                    "currentLanguage": await this.capability.getCurrentVoiceLanguage(),
                    "operationStatus": await this.capability.getVoicePackOperationStatus()
                });
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (req.body.action === "download" && req.body.url) {
                try {
                    await this.capability.downloadVoicePack({
                        url: req.body.url,
                        language: req.body.language,
                        hash: req.body.hash
                    });
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

module.exports = VoicePackManagementCapabilityRouter;
