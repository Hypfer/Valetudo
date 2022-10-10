const NotImplementedError = require("../NotImplementedError");
const PresetSelectionCapability = require("./PresetSelectionCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends PresetSelectionCapability<T>
 */
class OperationModeControlCapability extends PresetSelectionCapability {
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
        return OperationModeControlCapability.TYPE;
    }
}

OperationModeControlCapability.TYPE = "OperationModeControlCapability";

module.exports = OperationModeControlCapability;
