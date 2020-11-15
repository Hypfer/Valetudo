const NotImplementedError = require("../NotImplementedError");
const IntensityPresetCapability = require("./IntensityPresetCapability");

class CarpetTurboControlCapability extends IntensityPresetCapability {
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
        return CarpetTurboControlCapability.TYPE;
    }
}

CarpetTurboControlCapability.TYPE = "CarpetTurboControlCapability";

module.exports = CarpetTurboControlCapability;