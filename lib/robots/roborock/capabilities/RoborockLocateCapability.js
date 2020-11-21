const LocateCapability = require("../../../core/capabilities/LocateCapability");

class RoborockLocateCapability extends LocateCapability {
    /**
     * @returns {Promise<void>}
     */
    async locate() {
        await this.robot.sendCommand("find_me", [], {});
    }
}

module.exports = RoborockLocateCapability;