const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");
const ViomiMapParser = require("../../../ViomiMapParser");

class ViomiZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZone
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        const areas = [];
        /*
           valetudoZones.forEach(zone => {
            const pA = ViomiMapParser.positionToViomi(zone.points.pA.x, zone.points.pA.y);
            const pB = ViomiMapParser.positionToViomi(zone.points.pB.x, zone.points.pB.y);
            const pC = ViomiMapParser.positionToViomi(zone.points.pC.x, zone.points.pC.y);
            const pD = ViomiMapParser.positionToViomi(zone.points.pD.x, zone.points.pD.y);

            areas.push(
                [
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
        */

        const specs = this.toZoneSpec(areas, /*restricted=*/ false);
        /** @type {Array} */
        const args = [specs.length];
        this.robot.sendCommand("set_zone", args.concat(specs), {}).finally(() => {
            this.robot.pollMap();
        });
    }

    toZoneSpec(areas, restricted) {
        const mode = restricted ? 2 : 0;
        return areas.map((area, index) => {
            const a = ViomiMapParser.positionToViomi(area[0], area[1]);
            const b = ViomiMapParser.positionToViomi(area[2], area[3]);
            // Compute all the 4 corner points of the rectangle.
            const coords = [a.x, a.y, a.x, b.y, b.x, b.y, b.x, a.y];
            return `${index}_${mode}_` + coords.map(v => "" + v).join("_");
        });
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
                max: 10 //completely arbitrary. Is this correct?
            }
        };
    }
}

module.exports = ViomiZoneCleaningCapability;
