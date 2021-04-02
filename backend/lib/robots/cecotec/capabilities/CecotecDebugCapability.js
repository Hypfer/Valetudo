const DebugCapability = require("../../../core/capabilities/DebugCapability");

/**
 * @extends DebugCapability<import("../CecotecCongaRobot")>
 */
class CecotecDebugCapability extends DebugCapability {
    async debug({ opname, object }) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.send(opname, object);
    }
}

module.exports = CecotecDebugCapability;
