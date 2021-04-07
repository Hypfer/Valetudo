const DebugCapability = require("../../../core/capabilities/DebugCapability");

/**
 * @extends DebugCapability<import("../ViomiValetudoRobot")>
 */
class ViomiDebugCapability extends DebugCapability {
    async debug(payload) {
        // eslint-disable-next-line no-prototype-builtins
        switch (payload.action) {
            case "map":
                // Get map data
                return {data: this.robot.state.map};
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
