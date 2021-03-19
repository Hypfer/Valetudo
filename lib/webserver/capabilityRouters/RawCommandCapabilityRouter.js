const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class RawCommandCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.put("/", async (req, res) => {
            if (req.body) {
                try {
                    let response = await this.capability.rawCommand(req.body);
                    res.status(200).json(response);
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

module.exports = RawCommandCapabilityRouter;
