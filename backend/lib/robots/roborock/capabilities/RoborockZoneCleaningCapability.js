const RoborockMapParser = require("../RoborockMapParser");
const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");

/**
 * @extends ZoneCleaningCapability<import("../RoborockValetudoRobot")>
 */
class RoborockZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        const flippedRoborockZones = valetudoZones.map(valetudoZone => {
            const yFlippedZone = [
                Math.floor(valetudoZone.points.pA.x * 10),
                Math.floor(RoborockMapParser.DIMENSION_MM - valetudoZone.points.pA.y * 10),
                Math.floor(valetudoZone.points.pC.x * 10),
                Math.floor(RoborockMapParser.DIMENSION_MM - valetudoZone.points.pC.y * 10),
                valetudoZone.iterations
            ];

            // it seems as the vacuum only works with 'positive rectangles'! So flip the coordinates if the user entered them wrong.
            // x1 has to be < x2 and y1 < y2
            return [
                Math.min(yFlippedZone[0], yFlippedZone[2]),
                Math.min(yFlippedZone[1], yFlippedZone[3]),

                Math.max(yFlippedZone[0], yFlippedZone[2]),
                Math.max(yFlippedZone[1], yFlippedZone[3]),

                yFlippedZone[4]
            ];
        });

        await this.robot.sendCommand("app_zoned_clean", flippedRoborockZones, {});
    }

    /**
     * @returns {import("../../../core/capabilities/ZoneCleaningCapability").ZoneCleaningCapabilityProperties}
     */
    getProperties() {
        return {
            zoneCount: {
                min: 1,
                max: 5
            },
            iterationCount: {
                min: 1,
                max: 3
            }
        };
    }
}

module.exports = RoborockZoneCleaningCapability;
