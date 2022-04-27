const attributes = require("../ViomiCommonAttributes");
const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const Logger = require("../../../Logger");
const ViomiMapParser = require("../ViomiMapParser");
const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");

/**
 * @extends ZoneCleaningCapability<import("../ViomiValetudoRobot")>
 */
class ViomiZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     * @private
     * @returns {import("./ViomiBasicControlCapability")}
     */
    getBasicControlCapability() {
        return this.robot.capabilities[BasicControlCapability.TYPE];
    }

    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        let areas = [];
        const basicControlCap = this.getBasicControlCapability();

        const operationMode = basicControlCap.getVacuumOperationModeFromInstalledAccessories();
        await basicControlCap.ensureCleaningOperationMode(operationMode);

        // The app sends set_uploadmap [1] when the "draw area" button is pressed.
        // The robot seems to end up in a weird state if we don't do this.
        await this.robot.sendCommand("set_uploadmap", [1]);

        valetudoZones.forEach(zone => {
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
        await basicControlCap.setRectangularZoneMode(attributes.ViomiOperation.START);
    }

    /**
     * @returns {import("../../../core/capabilities/ZoneCleaningCapability").ZoneCleaningCapabilityProperties}
     */
    getProperties() {
        return {
            zoneCount: {
                min: 1,
                max: 10
            },
            iterationCount: {
                min: 1,
                max: 10 //completely arbitrary. Is this correct?
            }
        };
    }
}

module.exports = ViomiZoneCleaningCapability;
