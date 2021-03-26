const attributes = require("../ViomiCommonAttributes");
const Logger = require("../../../Logger");
const ViomiMapParser = require("../ViomiMapParser");
const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");

/**
 * @extends ZoneCleaningCapability<import("../ViomiValetudoRobot")>
 */
class ViomiZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        let areas = [];

        valetudoZones.forEach( zone => {
            const pA = ViomiMapParser.positionToViomi(zone.points.pA.x, zone.points.pA.y);
            const pC = ViomiMapParser.positionToViomi(zone.points.pC.x, zone.points.pC.y);

            for (let j = 0; j < zone.iterations; j++) {
                areas.push([areas.length,
                    attributes.ViomiArea.NORMAL,
                    pA.x.toFixed(4),
                    pA.y.toFixed(4),
                    pA.x.toFixed(4),
                    pC.y.toFixed(4),
                    pC.x.toFixed(4),
                    pC.y.toFixed(4),
                    pC.x.toFixed(4),
                    pA.y.toFixed(4),
                ].join("_"));
            }
        });

        Logger.trace("areas to clean: ", areas);
        await this.robot.sendCommand("set_zone", [areas.length].concat(areas), {});
        const movementMode = attributes.ViomiMovementMode.MOP_NO_VACUUM;
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
