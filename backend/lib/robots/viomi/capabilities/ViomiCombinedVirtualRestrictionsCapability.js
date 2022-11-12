/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");
const ThreeIRobotixMapParser = require("../../3irobotix/ThreeIRobotixMapParser");

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
            const pA = ThreeIRobotixMapParser.CONVERT_TO_THREEIROBOTIX_COORDINATES(wall.points.pA.x, wall.points.pA.y);
            const pB = ThreeIRobotixMapParser.CONVERT_TO_THREEIROBOTIX_COORDINATES(wall.points.pB.x, wall.points.pB.y);

            payload.push(
                [
                    payload.length + 1,
                    PERSISTENT_DATA_TYPES.WALL,
                    pA.x.toFixed(4),
                    pA.y.toFixed(4),
                    pB.x.toFixed(4),
                    pB.y.toFixed(4)
                ].join("_")
            );
        });

        virtualRestrictions.restrictedZones.forEach(zone => {
            const pA = ThreeIRobotixMapParser.CONVERT_TO_THREEIROBOTIX_COORDINATES(zone.points.pA.x, zone.points.pA.y);
            const pB = ThreeIRobotixMapParser.CONVERT_TO_THREEIROBOTIX_COORDINATES(zone.points.pB.x, zone.points.pB.y);
            const pC = ThreeIRobotixMapParser.CONVERT_TO_THREEIROBOTIX_COORDINATES(zone.points.pC.x, zone.points.pC.y);
            const pD = ThreeIRobotixMapParser.CONVERT_TO_THREEIROBOTIX_COORDINATES(zone.points.pD.x, zone.points.pD.y);

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

        await this.robot.sendCommand("set_wall", [payload.length].concat(payload), {});

        this.robot.pollMap();
    }
}

/** @enum {number} */
const PERSISTENT_DATA_TYPES = {
    "ZONE": 3,
    "WALL": 2
};


module.exports = ViomiCombinedVirtualRestrictionsCapability;
