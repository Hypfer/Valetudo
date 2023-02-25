const attributes = require("../ViomiCommonAttributes");
const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const ThreeIRobotixMapParser = require("../../3irobotix/ThreeIRobotixMapParser");
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

    async start(options) {
        let areas = [];
        const basicControlCap = this.getBasicControlCapability();

        if (options.iterations === 2) {
            await this.robot.sendCommand("set_repeat", [1], {});
        }


        // The app sends set_uploadmap [1] when the "draw area" button is pressed.
        // The robot seems to end up in a weird state if we don't do this.
        await this.robot.sendCommand("set_uploadmap", [1]);

        options.zones.forEach(zone => {
            const pA = ThreeIRobotixMapParser.CONVERT_TO_THREEIROBOTIX_COORDINATES(zone.points.pA.x, zone.points.pA.y);
            const pC = ThreeIRobotixMapParser.CONVERT_TO_THREEIROBOTIX_COORDINATES(zone.points.pC.x, zone.points.pC.y);

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
        });


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
                max: 2
            }
        };
    }
}

module.exports = ViomiZoneCleaningCapability;
