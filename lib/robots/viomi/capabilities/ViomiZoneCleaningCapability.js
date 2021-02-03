const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");
const ViomiMapParser = require("../../../ViomiMapParser");
const Logger = require("../../../Logger");
const attributes = require("../ViomiCommonAttributes");

class ViomiZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        let areas = [];

        valetudoZones.forEach( zone => {
            const pA = ViomiMapParser.positionToViomi(zone.points.pA.x, zone.points.pA.y);
            const pB = ViomiMapParser.positionToViomi(zone.points.pB.x, zone.points.pB.y);
            const pC = ViomiMapParser.positionToViomi(zone.points.pC.x, zone.points.pC.y);
            const pD = ViomiMapParser.positionToViomi(zone.points.pD.x, zone.points.pD.y);

            for (let j = 0; j < zone.iterations; j++) {
                areas.push([areas.length,
                    0,
                    pA.x.toFixed(4),
                    pA.y.toFixed(4),
                    pB.x.toFixed(4),
                    pB.y.toFixed(4),
                    pC.x.toFixed(4),
                    pC.y.toFixed(4),
                    pD.x.toFixed(4),
                    pD.y.toFixed(4)
                ].join("_"));
            }
        });

        Logger.info("areas to clean: ", areas);
        await this.robot.sendCommand("set_zone", [areas.length].concat(areas), {}).finally(() => {
            this.robot.pollMap();
        });

        const operationMode = attributes.ViomiOperationMode.VACUUM
        const movementMode = attributes.ViomiMovementMode.ZONED_CLEAN_OR_MOPPING;
        const additionalParamsLength = 0;

        await this.robot.sendCommand("set_mode", [movementMode, attributes.ViomiOperation.START, additionalParamsLength]);
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
