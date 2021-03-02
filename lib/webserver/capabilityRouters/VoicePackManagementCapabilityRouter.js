const Logger = require("../../Logger");
const CapabilityRouter = require("./CapabilityRouter");

class VoicePackManagementCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json({
                "currentLanguage": await this.capability.getCurrentVoiceLanguage(),
                "operationProgress": await this.capability.getVoicePackOperationProgress()
            });
        });

        this.router.get("/stockPack", async (req, res) => {
            res.json(await this.capability.getAvailableStockVoicePacks());
        });

        this.router.put("/stockPack", async (req, res) => {
            if (req.body && req.body.action === "enable" && req.body.language) {
                try {
                    await this.capability.enableStockVoicePack(req.body.language);
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Unable to set stock language pack", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Invalid request");
            }
        });

        this.router.get("/customPack", async (req, res) => {
            res.json({
                "supported": await this.capability.canDownloadCustomVoicePack()
            });
        });

        this.router.put("/customPack", async (req, res) => {
            if (req.body && req.body.action === "download" && req.body.presignedUrl) {
                try {
                    await this.capability.downloadCustomVoicePack({
                        presignedUrl: req.body.presignedUrl,
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