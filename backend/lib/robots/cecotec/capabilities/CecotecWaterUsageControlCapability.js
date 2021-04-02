const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");
const {DeviceWaterLevel} = require("@agnoc/core");

/**
 * @extends WaterUsageControlCapability<import("../CecotecCongaRobot")>
 */
class CecotecWaterUsageControlCapability extends WaterUsageControlCapability {
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
    async selectPreset(preset) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const matchedPreset = this.presets.find(p => p.name === preset);

        if (!matchedPreset) {
            throw new Error("Invalid Preset");
        }

        await this.robot.robot.setWaterLevel(new DeviceWaterLevel({ value: matchedPreset.value }));
    }
}

module.exports = CecotecWaterUsageControlCapability;
