const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class PresetSelectionCapability extends Capability {

    /**
     * @param {object} options
     * @param {T} options.robot
     * @param {Array<import("../../entities/core/ValetudoSelectionPreset")>} options.presets
     */
    constructor(options) {
        super(options);
        this.presets = options.presets;
    }
    /**
     * @returns {Array<string>}
     */
    getPresets() {
        return this.presets.map(p => {
            return p.name;
        });
    }

    /**
     * @abstract
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
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

module.exports = PresetSelectionCapability;
