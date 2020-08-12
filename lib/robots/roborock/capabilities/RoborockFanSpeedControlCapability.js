const FanSpeedControlCapability = require("../../../core/capabilities/FanSpeedControlCapability");

class RoborockFanSpeedControlCapability extends FanSpeedControlCapability {
    /**
     * @param options {object}
     * @param options.robot {import("../../../core/ValetudoRobot")|any}
     * @param options.presets {Array<import("../../../entities/core/ValetudoFanSpeedPreset")>}
     */
    constructor(options) {
        super(options);

        this.presets = options.presets;
    }
    /**
     * @returns {Array<string>}
     */
    getFanSpeedPresets() {
        return this.presets.map(p => p.name);
    }

    /**
     * @param preset {string}
     * @returns {Promise<void>}
     */
    async setFanSpeedPreset(preset) {
        const matchedPreset = this.presets.find(p => p.name === preset);

        if (matchedPreset) {
            await this.robot.sendCommand("set_custom_mode", [matchedPreset.value], {});
        } else {
            throw new Error("Invalid Preset");
        }
    }

}

module.exports = RoborockFanSpeedControlCapability;