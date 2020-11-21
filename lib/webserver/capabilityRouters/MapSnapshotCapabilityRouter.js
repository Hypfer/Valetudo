const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");
const ValetudoMapSnapshot = require("../../entities/core/ValetudoMapSnapshot");

class MapSnapshotCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getSnapshots());
        });

        this.router.put("/", async (req, res) => {
            if (req.body && req.body.action === "restore" && req.body.id) {
                try {
                    await this.capability.restoreSnapshot(new ValetudoMapSnapshot({id: req.body.id}));
                    res.sendStatus(200);
                } catch (e) {
                    Logger.warn("Error while restoring map snapshot", e);
                    res.status(500).json(e.message);
                }
            } else {
                res.status(400).send("Missing or invalid request body");
            }
        });
    }
}

module.exports = MapSnapshotCapabilityRouter;