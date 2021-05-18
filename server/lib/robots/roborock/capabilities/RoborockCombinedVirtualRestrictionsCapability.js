/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");

const RRMapParser = require("../RRMapParser");
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
            return total + currentElem.length - 1;
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
    "BARRIER": 1,
    "NO_MOP": 2
};


module.exports = RoborockCombinedVirtualRestrictionsCapability;
