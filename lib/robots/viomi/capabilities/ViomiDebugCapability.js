const DebugCapability = require("../../../core/capabilities/DebugCapability");

/**
 * @extends DebugCapability<import("../ViomiValetudoRobot")>
 */
class ViomiDebugCapability extends DebugCapability {
    async debug(payload) {
        // eslint-disable-next-line no-prototype-builtins
        if (payload.hasOwnProperty("method")) {
            return await this.robot.sendCommand(payload.method, payload.args, payload.options);
            // eslint-disable-next-line no-prototype-builtins
        } else if (payload.hasOwnProperty("cloud")) {
            return await this.robot.sendCloud(payload.cloud, payload.options);
        }
    }
}

module.exports = ViomiDebugCapability;
