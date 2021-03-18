const MapResetCapability = require("../../../core/capabilities/MapResetCapability");

class RoborockMapResetCapability extends MapResetCapability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
        await this.robot.sendCommand("reset_map", [], {});
    }
}

module.exports = RoborockMapResetCapability;
