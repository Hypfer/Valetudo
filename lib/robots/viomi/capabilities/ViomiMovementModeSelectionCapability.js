const attributes = require("../ViomiCommonAttributes");
const Logger = require("../../../Logger");
const MovementModeSelectionCapability = require("../../../core/capabilities/MovementModeSelectionCapability");
const PresetSelectionStateAttribute = require("../../../entities/state/attributes/PresetSelectionStateAttribute");
const ValetudoSelectionPreset = require("../../../entities/core/ValetudoSelectionPreset");

/**
 * @extends MovementModeSelectionCapability<import("../ViomiValetudoRobot")>
 */
class ViomiMovementModeSelectionCapability extends MovementModeSelectionCapability {
    /**
     * @param {object} options
     * @param {import("../ViomiValetudoRobot")} options.robot
     */
    constructor(options) {
        // noinspection JSCheckFunctionSignatures
        super(Object.assign(options, {
            presets: Object.keys(attributes.MOVEMENT_MODE_PRESETS).map(k => new ValetudoSelectionPreset({
                name: k,
                value: attributes.MOVEMENT_MODE_PRESETS[k]
            }))
        }));

        this.selectPreset(PresetSelectionStateAttribute.MOVEMENT_MODE.AUTO)
            .catch(reason => Logger.warn("Failed to set auto movement mode:", reason));
    }

    /**
     * @returns {Array<string>}
     */
    getPresets() {
        return this.presets.map(p => p.name);
    }

    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => p.name === preset);

        if (matchedPreset) {
            this.robot.state.upsertFirstMatchingAttribute(new PresetSelectionStateAttribute({
                type: PresetSelectionStateAttribute.TYPE.MOVEMENT_MODE,
                value: preset
            }));
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = ViomiMovementModeSelectionCapability;
