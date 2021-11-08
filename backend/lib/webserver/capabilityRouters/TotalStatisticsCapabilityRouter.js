const CapabilityRouter = require("./CapabilityRouter");
const Logger = require("../../Logger");

class TotalStatisticsCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getStatistics());
            } catch (e) {
                Logger.warn("Error while fetching total statistics", e);
                res.status(500).json(e.message);
            }
        });
    }
}

module.exports = TotalStatisticsCapabilityRouter;
