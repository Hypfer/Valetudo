const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class SpotCleaningCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body) {
                try {
                    await this.capability.spotClean();
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while initiating spot cleaning", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(404);
            }
        });
    }
}

module.exports = SpotCleaningCapabilityRouter;