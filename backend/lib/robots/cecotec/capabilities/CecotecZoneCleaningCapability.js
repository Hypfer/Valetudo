const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");
const {Pixel} = require("@agnoc/core");

/**
 * @extends ZoneCleaningCapability<import("../CecotecCongaRobot")>
 */
module.exports = class CecotecZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const map = this.robot.robot.device.map;

        if (!map) {
            throw new Error("There is no map in connected robot");
        }

        const offset = map.size.y;
        const areas = valetudoZones.map(({ points }) => {
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
        });

        await this.robot.robot.cleanAreas(areas);
    }
};
