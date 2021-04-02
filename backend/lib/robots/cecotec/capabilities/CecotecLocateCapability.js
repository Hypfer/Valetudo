const LocateCapability = require("../../../core/capabilities/LocateCapability");

/**
 * @extends LocateCapability<import("../CecotecCongaRobot")>
 */
module.exports = class CecotecLocateCapability extends LocateCapability {
    async locate() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.locate();
    }
};
