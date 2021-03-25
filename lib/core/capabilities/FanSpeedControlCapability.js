const IntensityPresetCapability = require("./IntensityPresetCapability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends IntensityPresetCapability<T>
 */
class FanSpeedControlCapability extends IntensityPresetCapability {
    /**
     * @abstract
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async setIntensity(preset) {
        throw new NotImplementedError();
    }

    /**
     * @returns {string}
     */
    getType() {
        return FanSpeedControlCapability.TYPE;
    }
}

FanSpeedControlCapability.TYPE = "FanSpeedControlCapability";

module.exports = FanSpeedControlCapability;
