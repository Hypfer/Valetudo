const GoToLocationCapability = require("../../../core/capabilities/GoToLocationCapability");
const ViomiMapParser = require("../../../ViomiMapParser");

class ViomiGoToLocationCapability extends GoToLocationCapability {
    /**
     * @param {import("../../../entities/core/ValetudoGoToLocation")} valetudoGoToLocation
     * @returns {Promise<void>}
     */
    async goTo(valetudoGoToLocation) {
        const coord = ViomiMapParser.positionToViomi(valetudoGoToLocation.coordinates.x, valetudoGoToLocation.coordinates.y);
    
        await this.robot.sendCommand("set_uploadmap", [0]);
        await this.robot.sendCommand("set_pointclean", [1, coord.x, coord.y], {});
    }
}

module.exports = ViomiGoToLocationCapability;
