const RawCommandCapability = require("../../../core/capabilities/RawCommandCapability");

class ViomiRawCommandCapability extends RawCommandCapability {
    async rawCommand(payload) {
        return await this.robot.sendCommand(payload.method, payload.args, payload.options);
    }
}

module.exports = ViomiRawCommandCapability;