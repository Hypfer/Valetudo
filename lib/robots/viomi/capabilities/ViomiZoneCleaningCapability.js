const ZoneCleaningCapability = require("../../../core/capabilities/ZoneCleaningCapability");
const ViomiMapParser = require("../../../ViomiMapParser");

const attributes = require("../ViomiCommonAttributes");
class ViomiZoneCleaningCapability extends ZoneCleaningCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoZone")>} valetudoZones
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        let procesedZones = new Array();
        
        for (let k in valetudoZones) {
            let zone = valetudoZones[k];
            let a = ViomiMapParser.positionToViomi(zone[0], zone[1]);
            let b = ViomiMapParser.positionToViomi(zone[2], zone[3]);
            let iterations = zone[4];

            let x1 = a.x.toFixed(4);
            let y1 = a.y.toFixed(4);
            let x2 = b.x.toFixed(4);
            let y2 = b.y.toFixed(4);

            for (let j = 0; j < iterations; j++) {
                procesedZones.push([procesedZones.length, 0, x1, y1, x1, y2, x2, y2, x2, y1].join("_"));
            }
        }

        await this.robot.sendCommand("set_uploadmap", [1]);
        await this.robot.sendCommand("set_zone", [procesedZones.length].concat(procesedZones), {});
        await this.robot.sendCommand("set_mode", 
        {
            operation: attributes.ViomiOperation.START,
            movementMode: attributes.ViomiMovementMode.ZONED_CLEAN_OR_MOPPING
        }, {});
    }
}

module.exports = ViomiZoneCleaningCapability;
