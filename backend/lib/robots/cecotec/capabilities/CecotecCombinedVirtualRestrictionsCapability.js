/**
 * @typedef {import("../../../entities/core/ValetudoVirtualRestrictions")} ValetudoVirtualRestrictions
 */

const CombinedVirtualRestrictionsCapability = require("../../../core/capabilities/CombinedVirtualRestrictionsCapability");
const {Pixel} = require("@agnoc/core");

/**
 * @extends CombinedVirtualRestrictionsCapability<import("../CecotecCongaRobot")>
 */
class CecotecCombinedVirtualRestrictionsCapability extends CombinedVirtualRestrictionsCapability {
    /**
     * @param {ValetudoVirtualRestrictions} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions({ virtualWalls, restrictedZones }) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const map = this.robot.robot.device.map;

        if (!map) {
            return;
        }

        const offset = map.size.y;
        const areas = [
            ...virtualWalls.map(({ points }) => {
                return [
                    map.toCoordinate(new Pixel({
                        x: points.pA.x,
                        y: offset - points.pA.y,
                    })),
                    map.toCoordinate(new Pixel({
                        x: points.pB.x,
                        y: offset - points.pB.y,
                    })),
                    map.toCoordinate(new Pixel({
                        x: points.pA.x,
                        y: offset - points.pA.y,
                    })),
                    map.toCoordinate(new Pixel({
                        x: points.pB.x,
                        y: offset - points.pB.y,
                    })),
                ];
            }),
            ...restrictedZones.map(({ points }) => {
                return [
                    map.toCoordinate(new Pixel({
                        x: points.pA.x,
                        y: offset - points.pA.y,
                    })),
                    map.toCoordinate(new Pixel({
                        x: points.pD.x,
                        y: offset - points.pD.y,
                    })),
                    map.toCoordinate(new Pixel({
                        x: points.pC.x,
                        y: offset - points.pC.y,
                    })),
                    map.toCoordinate(new Pixel({
                        x: points.pB.x,
                        y: offset - points.pB.y,
                    })),
                ];
            })
        ];

        await this.robot.robot.setRestrictedZones(areas);
        await this.robot.robot.updateMap();
    }
}

module.exports = CecotecCombinedVirtualRestrictionsCapability;
