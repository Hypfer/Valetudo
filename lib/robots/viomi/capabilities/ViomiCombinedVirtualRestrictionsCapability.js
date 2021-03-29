/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");
const ViomiMapParser = require("../ViomiMapParser");

/**
 * @extends CombinedVirtualRestrictionsCapability<import("../ViomiValetudoRobot")>
 */
class ViomiCombinedVirtualRestrictionsCapability extends CombinedVirtualRestrictionsCapability {
    /**
     * @param {ValetudoVirtualRestrictions} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions(virtualRestrictions) {
        const payload = [];

        virtualRestrictions.virtualWalls.forEach(wall => {
            const pA = ViomiMapParser.positionToViomi(wall.points.pA.x, wall.points.pA.y);
            const pB = ViomiMapParser.positionToViomi(wall.points.pB.x, wall.points.pB.y);

            payload.push(
                [
                    payload.length + 1,
                    PERSISTENT_DATA_TYPES.BARRIER,
                    pA.x.toFixed(4),
                    pA.y.toFixed(4),
                    pB.x.toFixed(4),
                    pB.y.toFixed(4)
                ].join("_")
            );
        });

        virtualRestrictions.restrictedZones.forEach(zone => {
            const pA = ViomiMapParser.positionToViomi(zone.points.pA.x, zone.points.pA.y);
            const pB = ViomiMapParser.positionToViomi(zone.points.pB.x, zone.points.pB.y);
            const pC = ViomiMapParser.positionToViomi(zone.points.pC.x, zone.points.pC.y);
            const pD = ViomiMapParser.positionToViomi(zone.points.pD.x, zone.points.pD.y);

            payload.push(
                [
                    payload.length + 1,
                    PERSISTENT_DATA_TYPES.ZONE,
                    pA.x.toFixed(4),
                    pA.y.toFixed(4),
                    pB.x.toFixed(4),
                    pB.y.toFixed(4),
                    pC.x.toFixed(4),
                    pC.y.toFixed(4),
                    pD.x.toFixed(4),
                    pD.y.toFixed(4)
                ].join("_")
            );
        });

        this.robot.sendCommand("set_wall", [payload.length].concat(payload), {}).finally(() => {
            this.robot.pollMap();
        });
    }
}

/** @enum {number} */
const PERSISTENT_DATA_TYPES = {
    "ZONE": 3,
    "BARRIER": 2
};


module.exports = ViomiCombinedVirtualRestrictionsCapability;
