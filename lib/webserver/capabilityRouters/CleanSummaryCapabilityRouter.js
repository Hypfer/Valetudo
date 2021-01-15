const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class CleanSummaryCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getCleanSummary());
        });
    }
}

module.exports = CleanSummaryCapabilityRouter;