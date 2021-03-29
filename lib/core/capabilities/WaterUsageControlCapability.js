const IntensityPresetCapability = require("./IntensityPresetCapability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends IntensityPresetCapability<T>
 */
class WaterUsageControlCapability extends IntensityPresetCapability {
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
        return WaterUsageControlCapability.TYPE;
    }
}

WaterUsageControlCapability.TYPE = "WaterUsageControlCapability";

module.exports = WaterUsageControlCapability;
