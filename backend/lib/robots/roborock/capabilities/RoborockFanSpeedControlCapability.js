const FanSpeedControlCapability = require("../../../core/capabilities/FanSpeedControlCapability");

/**
 * @extends FanSpeedControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockFanSpeedControlCapability extends FanSpeedControlCapability {
    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => {
            return p.name === preset;
        });

        if (matchedPreset) {
            await this.robot.sendCommand("set_custom_mode", [matchedPreset.value], {});
        } else {
            throw new Error("Invalid Preset");
        }
    }

}

module.exports = RoborockFanSpeedControlCapability;
