const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");

/**
 * @extends WaterUsageControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockWaterUsageControlCapability extends WaterUsageControlCapability {
    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => {
            return p.name === preset;
        });

        if (matchedPreset) {
            await this.robot.sendCommand("set_water_box_custom_mode", [matchedPreset.value], {});
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = RoborockWaterUsageControlCapability;
