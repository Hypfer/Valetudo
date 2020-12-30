const LocateCapability = require("../../../core/capabilities/LocateCapability");

class ViomiLocateCapability extends LocateCapability {
    /**
     * @returns {Promise<void>}
     */
    async locate() {
        await this.robot.sendCommand("set_resetpos", [1]);
    }
}

module.exports = ViomiLocateCapability;
