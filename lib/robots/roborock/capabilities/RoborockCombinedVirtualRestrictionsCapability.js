/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");
const ValetudoVirtualRestrictions = require("../../../entities/core/ValetudoVirtualRestrictions");
const ValetudoVirtualWall = require("../../../entities/core/ValetudoVirtualWall");
const ValetudoRestrictedZone = require("../../../entities/core/ValetudoRestrictedZone");

const RRMapParser = require("../../../RRMapParser");

const entities = require("../../../entities");

class RoborockCombinedVirtualRestrictionsCapability extends CombinedVirtualRestrictionsCapability {
    /**
     * @abstract
     * @returns {Promise<ValetudoVirtualRestrictions>}
     */
    async getVirtualRestrictions() {
        const virtualWalls = [];
        const restrictedZones = [];


        this.robot.state.map.entities.filter(e => {
            return (e instanceof entities.map.LineMapEntity && e.type === entities.map.LineMapEntity.TYPE.VIRTUAL_WALL) ||
                   (e instanceof entities.map.PolygonMapEntity && e.type === entities.map.PolygonMapEntity.TYPE.NO_GO_AREA);
        }).forEach(restriction => {
            if (restriction instanceof entities.map.LineMapEntity) {
                virtualWalls.push(new ValetudoVirtualWall({
                    points: {
                        pA: {
                            x: restriction.points[0],
                            y: restriction.points[1]
                        },
                        pB: {
                            x: restriction.points[1],
                            y: restriction.points[2]
                        }
                    }
                }));
            } else if (restriction instanceof entities.map.PolygonMapEntity) {
                restrictedZones.push(new ValetudoRestrictedZone({
                    points: {
                        pA: {
                            x: restriction.points[0],
                            y: restriction.points[1]
                        },
                        pB: {
                            x: restriction.points[1],
                            y: restriction.points[2]
                        },
                        pC: {
                            x: restriction.points[3],
                            y: restriction.points[4]
                        },
                        pD: {
                            x: restriction.points[5],
                            y: restriction.points[6]
                        }
                    }
                }));
            }
        });

        return new ValetudoVirtualRestrictions({
            virtualWalls: virtualWalls,
            restrictedZones: restrictedZones
        });
    }

    /**
     *
     * @param {ValetudoVirtualRestrictions} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions(virtualRestrictions) {
        const roborockPayload = [];

        virtualRestrictions.virtualWalls.forEach(wall => {
            roborockPayload.push([
                PERSISTENT_DATA_TYPES.BARRIER,

                wall.points.pA.x * 10,
                RRMapParser.DIMENSION_MM - wall.points.pA.y * 10,
                wall.points.pB.x * 10,
                RRMapParser.DIMENSION_MM - wall.points.pB.y * 10,
            ]);
        });

        virtualRestrictions.restrictedZones.forEach(zone => {
            roborockPayload.push([
                PERSISTENT_DATA_TYPES.ZONE,

                zone.points.pA.x * 10,
                RRMapParser.DIMENSION_MM - zone.points.pA.y * 10,
                zone.points.pB.x * 10,
                RRMapParser.DIMENSION_MM - zone.points.pB.y * 10,
                zone.points.pC.x * 10,
                RRMapParser.DIMENSION_MM - zone.points.pC.y * 10,
                zone.points.pD.x * 10,
                RRMapParser.DIMENSION_MM - zone.points.pD.y * 10,
            ]);
        });

        if (roborockPayload.reduce((total, currentElem) => {
            return total += currentElem.length - 1;
        }, 0) > 68) {
            throw new Error("too many forbidden markers to save!");
        }


        this.robot.sendCommand("save_map", roborockPayload, {timeout: 3500}).finally(() => {
            this.robot.pollMap();
        });
    }
}

/** @enum {number} */
const PERSISTENT_DATA_TYPES = {
    "ZONE": 0,
    "BARRIER": 1
};


module.exports = RoborockCombinedVirtualRestrictionsCapability;