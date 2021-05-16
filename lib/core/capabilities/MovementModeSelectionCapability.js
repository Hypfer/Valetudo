const NotImplementedError = require("../NotImplementedError");
const PresetSelectionCapability = require("./PresetSelectionCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends PresetSelectionCapability<T>
 */
class MovementModeSelectionCapability extends PresetSelectionCapability {
    /**
     * @abstract
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        throw new NotImplementedError();
    }

    /**
     * @returns {string}
     */
    getType() {
        return MovementModeSelectionCapability.TYPE;
    }
}

MovementModeSelectionCapability.TYPE = "MovementModeSelectionCapability";

module.exports = MovementModeSelectionCapability;
