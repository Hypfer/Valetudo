const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class LocateCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action === "locate") {
                try {
                    await this.capability.locate();
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while locating robot", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing or invalid request body");
            }
        });
    }
}

module.exports = LocateCapabilityRouter;