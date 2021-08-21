const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");

/**
 * @extends WaterUsageControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiWaterUsageControlCapability extends WaterUsageControlCapability {
    /**
     * @returns {Array<string>}
     */
    getPresets() {
        return this.presets.map(p => {
            return p.name;
        });
    }

    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => {
            return p.name === preset;
        });

        if (matchedPreset) {
            await this.robot.sendCommand("set_suction", [matchedPreset.value], {});
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = ViomiWaterUsageControlCapability;
