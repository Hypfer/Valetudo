const CapabilityRouter = require("./CapabilityRouter");
const Logger = require("../../Logger");

class StatisticsCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getStatistics());
            } catch (e) {
                Logger.warn("Error while fetching statistics", e);
                res.status(500).json(e.message);
            }
        });
    }
}

module.exports = StatisticsCapabilityRouter;
