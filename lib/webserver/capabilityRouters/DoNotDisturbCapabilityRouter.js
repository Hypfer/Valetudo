const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class DoNotDisturbCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getDndConfiguration());
        });

        this.router.delete("/", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "delete") {
                    try {
                        await this.capability.deleteDndConfiguration();
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while deleting do not disturb setting", e);
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.start && req.body.end) {
                try {
                    await this.capability.setDndConfiguration(req.body);
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while configuring do not disturb setting", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing parameters in request body");
            }
        });
    }
}

module.exports = DoNotDisturbCapabilityRouter;