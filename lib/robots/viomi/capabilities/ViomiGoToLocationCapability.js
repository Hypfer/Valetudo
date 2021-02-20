const GoToLocationCapability = require("../../../core/capabilities/GoToLocationCapability");
const ViomiMapParser = require("../../../ViomiMapParser");
const Logger = require("../../../Logger");

class ViomiGoToLocationCapability extends GoToLocationCapability {
    /**
     * @param {import("../../../entities/core/ValetudoGoToLocation")} valetudoGoToLocation
     * @returns {Promise<void>}
     */
    async goTo(valetudoGoToLocation) {
        const point = ViomiMapParser.positionToViomi(valetudoGoToLocation.coordinates.x, valetudoGoToLocation.coordinates.y);
        Logger.trace("location to go: ", point.x, point.y);
        await this.robot.sendCommand("set_uploadmap", [0]);
        await this.robot.sendCommand("set_pointclean", [1, point.x, point.y], {});
    }
}

module.exports = ViomiGoToLocationCapability;
