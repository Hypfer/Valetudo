const Logger = require("../../Logger");

const CapabilityRouter = require("./CapabilityRouter");

class SensorCalibrationCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getSensors());
        });

        this.router.put("/:type/:sub_type?", async (req, res) => {
            if (req.body && req.body.action) {
                if (req.body.action === "calibrate") {
                    try {
                        await this.capability.calibrateSensor(req.params.type, req.params.subType);
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while calibrating sensor " + req.params.type + " " + req.params.subType, e);
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send("Invalid action \"" + req.body.action + "\" in request body");
                }
            } else {
                res.status(400).send("Missing action in request body");
            }
        });
    }
}

module.exports = SensorCalibrationCapabilityRouter;