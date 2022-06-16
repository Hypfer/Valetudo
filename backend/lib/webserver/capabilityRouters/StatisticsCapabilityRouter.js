const CapabilityRouter = require("./CapabilityRouter");

class StatisticsCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getStatistics());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });
    }
}

module.exports = StatisticsCapabilityRouter;
