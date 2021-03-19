const GoToLocationCapability = require("../../../core/capabilities/GoToLocationCapability");
const RRMapParser = require("../../../RRMapParser");

class RoborockGoToLocationCapability extends GoToLocationCapability {
    /**
     * @param {import("../../../entities/core/ValetudoGoToLocation")} valetudoGoToLocation
     * @returns {Promise<void>}
     */
    async goTo(valetudoGoToLocation) {
        await this.robot.sendCommand(
            "app_goto_target",
            [
                valetudoGoToLocation.coordinates.x * 10,
                RRMapParser.DIMENSION_MM - valetudoGoToLocation.coordinates.y * 10
            ],
            {}
        );
    }
}

module.exports = RoborockGoToLocationCapability;
