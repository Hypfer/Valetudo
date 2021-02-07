const NotImplementedError = require("../NotImplementedError");
const IntensityPresetCapability = require("./IntensityPresetCapability");

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
