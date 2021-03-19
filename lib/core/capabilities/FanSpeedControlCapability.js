const NotImplementedError = require("../NotImplementedError");
const IntensityPresetCapability = require("./IntensityPresetCapability");

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
