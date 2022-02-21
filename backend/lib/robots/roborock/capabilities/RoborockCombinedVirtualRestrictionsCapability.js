/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");

const RoborockMapParser = require("../RoborockMapParser");
const ValetudoRestrictedZone = require("../../../entities/core/ValetudoRestrictedZone");

/**
 * @extends CombinedVirtualRestrictionsCapability<import("../RoborockValetudoRobot")>
 */
class RoborockCombinedVirtualRestrictionsCapability extends CombinedVirtualRestrictionsCapability {
    /**
     *
     * @param {ValetudoVirtualRestrictions} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions(virtualRestrictions) {
        const roborockPayload = [];
        let vertexCount = 0;

        virtualRestrictions.virtualWalls.forEach(wall => {
            roborockPayload.push([
                PERSISTENT_DATA_TYPES.BARRIER,

                Math.floor(wall.points.pA.x * 10),
                Math.floor(RoborockMapParser.DIMENSION_MM - wall.points.pA.y * 10),
                Math.floor(wall.points.pB.x * 10),
                Math.floor(RoborockMapParser.DIMENSION_MM - wall.points.pB.y * 10),
            ]);

            vertexCount = vertexCount + 2;
        });

        virtualRestrictions.restrictedZones.forEach(zone => {
            let type;

            switch (zone.type) {
                case ValetudoRestrictedZone.TYPE.REGULAR:
                    type = PERSISTENT_DATA_TYPES.ZONE;
                    break;
                case ValetudoRestrictedZone.TYPE.MOP:
                    type = PERSISTENT_DATA_TYPES.NO_MOP;
                    break;
            }

            roborockPayload.push([
                type,

                Math.floor(zone.points.pA.x * 10),
                Math.floor(RoborockMapParser.DIMENSION_MM - zone.points.pA.y * 10),
                Math.floor(zone.points.pB.x * 10),
                Math.floor(RoborockMapParser.DIMENSION_MM - zone.points.pB.y * 10),
                Math.floor(zone.points.pC.x * 10),
                Math.floor(RoborockMapParser.DIMENSION_MM - zone.points.pC.y * 10),
                Math.floor(zone.points.pD.x * 10),
                Math.floor(RoborockMapParser.DIMENSION_MM - zone.points.pD.y * 10)
            ]);

            vertexCount = vertexCount + 4;
        });

        if (vertexCount > 68) {
            throw new Error("Too many vertices to save");
        }


        await this.robot.sendCommand("save_map", roborockPayload, {timeout: 3500});

        this.robot.pollMap();
    }
}

/** @enum {number} */
const PERSISTENT_DATA_TYPES = {
    "ZONE": 0,
    "BARRIER": 1,
    "NO_MOP": 2
};


module.exports = RoborockCombinedVirtualRestrictionsCapability;
