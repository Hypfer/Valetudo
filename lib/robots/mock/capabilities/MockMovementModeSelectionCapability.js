const entities = require("../../../entities");
const ValetudoSelectionPreset = require("../../../entities/core/ValetudoSelectionPreset");
const MovementModeSelectionCapability = require("../../../core/capabilities/MovementModeSelectionCapability");
const stateAttrs = entities.state.attributes;

/**
 * @extends MovementModeSelectionCapability<import("../MockRobot")>
 */
class MockMovementModeSelectionCapability extends MovementModeSelectionCapability {
    /**
     * @param {object} options
     * @param {import("../MockRobot")} options.robot
     */
    constructor(options) {
        let presets = [
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.MOVEMENT_MODE.AUTO, value: 0}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.MOVEMENT_MODE.MODE_S, value: 1}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.MOVEMENT_MODE.MODE_Y, value: 2}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.MOVEMENT_MODE.OUTLINES, value: 3}),
        ];
        super({
            robot: options.robot,
            presets: presets
        });

        this.StateAttr = new stateAttrs.PresetSelectionStateAttribute({
            type: stateAttrs.PresetSelectionStateAttribute.TYPE.MOVEMENT_MODE,
            value: stateAttrs.PresetSelectionStateAttribute.MOVEMENT_MODE.AUTO
        });

        this.robot.state.upsertFirstMatchingAttribute(this.StateAttr);
    }

    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => p.name === preset);

        if (matchedPreset) {
            this.StateAttr.value = matchedPreset.name;
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = MockMovementModeSelectionCapability;
