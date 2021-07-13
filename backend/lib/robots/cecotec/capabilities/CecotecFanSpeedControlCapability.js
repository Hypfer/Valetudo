const FanSpeedControlCapability = require("../../../core/capabilities/FanSpeedControlCapability");
const {DeviceFanSpeed} = require("@agnoc/core");

/**
 * @extends FanSpeedControlCapability<import("../CecotecCongaRobot")>
 */
module.exports = class CecotecFanSpeedControlCapability extends FanSpeedControlCapability {
    /**
     * @returns {Array<string>}
     */
    getFanSpeedPresets() {
        return this.presets.map(p => p.name);
    }

    async selectPreset(preset) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const matchedPreset = this.presets.find(p => p.name === preset);

        if (!matchedPreset) {
            throw new Error("Invalid Preset");
        }

        await this.robot.robot.setFanSpeed(new DeviceFanSpeed({ value: matchedPreset.value }));
    }
};
