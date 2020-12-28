const Logger = require("../../Logger");
const CapabilityRouter = require("./CapabilityRouter");

const ValetudoVirtualRestrictions = require("../../entities/core/ValetudoVirtualRestrictions");
const ValetudoVirtualWall = require("../../entities/core/ValetudoVirtualWall");
const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");

class CombinedVirtualRestrictionsCapabilityRouter extends CapabilityRouter {

    initRoutes() {
        this.router.get("/", async (req, res) => {
            res.json(await this.capability.getVirtualRestrictions());
        });

        this.router.put("/", async (req, res) => {
            if (req.body) {
                if (Array.isArray(req.body.virtualWalls) && Array.isArray(req.body.restrictedZones)) {
                    //TODO: add json schema request validation so that this doesn't fail catastrophically
                    const virtualRestrictions = new ValetudoVirtualRestrictions({
                        virtualWalls: req.body.virtualWalls.map(requestWall => new ValetudoVirtualWall({
                            points: requestWall.points
                        })),
                        restrictedZones: req.body.restrictedZones.map(requestZone => new ValetudoRestrictedZone({
                            points: requestZone.points
                        }))
                    });

                    try {
                        await this.capability.setVirtualRestrictions(virtualRestrictions);
                        res.sendStatus(200);
                    } catch (e) {
                        Logger.warn("Error while saving virtual restrictions", e);
                        res.status(500).json(e.message);
                    }
                } else {
                    res.status(400).send("Missing virtualWalls or restrictedZones property in request body");
                }
            } else {
                res.status(400).send("Missing request body");
            }
        });
    }
}

module.exports = CombinedVirtualRestrictionsCapabilityRouter;