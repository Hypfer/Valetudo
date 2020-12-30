const RawCommandCapability = require("../../../core/capabilities/RawCommandCapability");

class ViomiRawCommandCapability extends RawCommandCapability {
    async rawCommand(payload) {
        // eslint-disable-next-line no-prototype-builtins
        if (payload.hasOwnProperty("method")) {
            return await this.robot.sendCommand(payload.method, payload.args, payload.options);
            // eslint-disable-next-line no-prototype-builtins
        } else if (payload.hasOwnProperty("cloud")) {
            return await this.robot.sendCloud(payload.cloud, payload.options);
        }
    }
}

module.exports = ViomiRawCommandCapability;
