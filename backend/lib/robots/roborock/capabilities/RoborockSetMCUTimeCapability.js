const SetMCUTimeCapability = require("../../../core/capabilities/SetMCUTimeCapability");

/**
 * @extends SetMCUTimeCapability<import("../RoborockValetudoRobot")>
 */
class RoborockSetMCUTimeCapability extends SetMCUTimeCapability {
    /**
     * Sets the MCU time
     *
     * @param {Date} date
     * @returns {Promise<void>}
     */
    async setTime(date) {
        await this.robot.sendCommand("local.time", [Math.floor(date.valueOf() / 1000)], {});
    }
}

module.exports = RoborockSetMCUTimeCapability;
