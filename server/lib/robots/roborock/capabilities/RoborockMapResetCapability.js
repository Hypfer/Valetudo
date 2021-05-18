const MapResetCapability = require("../../../core/capabilities/MapResetCapability");

/**
 * @extends MapResetCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMapResetCapability extends MapResetCapability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
        await this.robot.sendCommand("reset_map", [], {});
    }
}

module.exports = RoborockMapResetCapability;
