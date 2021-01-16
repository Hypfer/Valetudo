const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class CleanHistoryCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getCleanSummary());
        });

        this.router.put("/:recordId", async (req, res) => {
            if (req.body) {
                try {
                    res.json(await this.capability.getCleanRecord(req.params.recordId));
                } catch (e) {
                    Logger.warn("Error while getting cleaning record " + req.params.recordId, e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(404);
            }
        });
    }
}

module.exports = CleanHistoryCapabilityRouter;