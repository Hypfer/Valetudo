const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class IntensityPresetCapability extends Capability {

    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")|any} options.robot
     * @param {Array<import("../../entities/core/ValetudoIntensityPreset")>} options.presets
     */
    constructor(options) {
        super(options);
        this.presets = options.presets;
    }
    /**
     * @returns {Array<string>}
     */
    getPresets() {
        return this.presets.map(p => p.name);
    }

    /**
     * @abstract
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async setIntensity(preset) {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {string}
     */
    getType() {
        throw new NotImplementedError();
    }
}

module.exports = IntensityPresetCapability;
