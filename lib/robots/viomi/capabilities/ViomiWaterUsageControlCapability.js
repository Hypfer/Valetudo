const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");

/**
 * @extends WaterUsageControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiWaterUsageControlCapability extends WaterUsageControlCapability {
    /**
     * @returns {Array<string>}
     */
    getPresets() {
        return this.presets.map(p => p.name);
    }

    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async setIntensity(preset) {
        const matchedPreset = this.presets.find(p => p.name === preset);

        if (matchedPreset) {
            await this.robot.sendCommand("set_suction", [matchedPreset.value], {});
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = ViomiWaterUsageControlCapability;
