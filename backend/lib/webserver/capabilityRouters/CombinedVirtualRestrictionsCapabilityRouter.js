const CapabilityRouter = require("./CapabilityRouter");
const ValetudoRestrictedZone = require("../../entities/core/ValetudoRestrictedZone");
const ValetudoVirtualRestrictions = require("../../entities/core/ValetudoVirtualRestrictions");
const ValetudoVirtualWall = require("../../entities/core/ValetudoVirtualWall");

class CombinedVirtualRestrictionsCapabilityRouter extends CapabilityRouter {
    initRoutes() {
        this.router.get("/", async (req, res) => {
            try {
                res.json(await this.capability.getVirtualRestrictions());
            } catch (e) {
                this.sendErrorResponse(req, res, e);
            }
        });

        this.router.put("/", this.validator, async (req, res) => {
            if (Array.isArray(req.body.virtualWalls) && Array.isArray(req.body.restrictedZones)) {
                const virtualRestrictions = new ValetudoVirtualRestrictions({
                    virtualWalls: req.body.virtualWalls.map(requestWall => {
                        return new ValetudoVirtualWall({
                            points: requestWall.points
                        });
                    }),
                    restrictedZones: req.body.restrictedZones.map(requestZone => {
                        return new ValetudoRestrictedZone({
                            points: requestZone.points,
                            type: requestZone.type
                        });
                    })
                });

                try {
                    await this.capability.setVirtualRestrictions(virtualRestrictions);
                    res.sendStatus(200);
                } catch (e) {
                    this.sendErrorResponse(req, res, e);
                }
            } else {
                res.sendStatus(400);
            }
        });
    }
}

module.exports = CombinedVirtualRestrictionsCapabilityRouter;
