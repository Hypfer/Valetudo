const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");

class RoborockWaterUsageControlCapability extends WaterUsageControlCapability {
    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async setIntensity(preset) {
        const matchedPreset = this.presets.find(p => p.name === preset);

        if (matchedPreset) {
            await this.robot.sendCommand("set_water_box_custom_mode", [matchedPreset.value], {});
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = RoborockWaterUsageControlCapability;
