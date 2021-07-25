const MapResetCapability = require("../../../core/capabilities/MapResetCapability");

/**
 * @extends MapResetCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMultiMapMapResetCapability extends MapResetCapability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
        let res = await this.robot.sendCommand("del_map", [0], {});

        if (!(Array.isArray(res) && res[0] === "ok")) {
            throw new Error("Failed to reset map: " + res);
        }

        this.robot.clearValetudoMap();
    }
}

module.exports = RoborockMultiMapMapResetCapability;
