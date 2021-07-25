const MapResetCapability = require("../../../core/capabilities/MapResetCapability");

/**
 * @extends MapResetCapability<import("../ViomiValetudoRobot")>
 */
class ViomiMapResetCapability extends MapResetCapability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
        await this.robot.sendCommand("set_resetmap", [], {});

        this.robot.clearValetudoMap();
    }
}

module.exports = ViomiMapResetCapability;
