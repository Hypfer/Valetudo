const DebugCapability = require("../../../core/capabilities/DebugCapability");

/**
 * @extends DebugCapability<import("../ViomiValetudoRobot")>
 */
class ViomiDebugCapability extends DebugCapability {
    async debug(payload) {
        // eslint-disable-next-line no-prototype-builtins
        switch (payload.action) {
            case "last_map":
                // Get map data
                return {raw: this.robot.lastRawMap, parsed: this.robot.state.map};
            case "last_err_map":
                return {raw: this.robot.lastFailedRawMap, error: this.robot.lastMapError};
            default:
                // miIO raw command
                switch (payload.mode) {
                    case "local":
                        return await this.robot.localSocket.sendMessage(payload.method, payload.params, payload.options);
                    case "cloud":
                        return await this.robot.sendCloud({
                            method: payload.method,
                            params: payload.params
                        }, payload.options);
                    default:
                        return await this.robot.sendCommand(payload.method, payload.params, payload.options);
                }
        }
    }
}

module.exports = ViomiDebugCapability;
