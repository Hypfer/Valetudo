const entities = require("../../../entities");
const ValetudoSelectionPreset = require("../../../entities/core/ValetudoSelectionPreset");
const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");
const stateAttrs = entities.state.attributes;

/**
 * @extends WaterUsageControlCapability<import("../MockRobot")>
 */
class MockWaterUsageControlCapability extends WaterUsageControlCapability {
    /**
     * @param {object} options
     * @param {import("../MockRobot")} options.robot
     */
    constructor(options) {
        let presets = [
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.VALUE.OFF, value: 0}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.VALUE.MIN, value: 1}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.VALUE.LOW, value: 2}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.VALUE.MEDIUM, value: 3}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.VALUE.HIGH, value: 4}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.VALUE.TURBO, value: 5}),
            new ValetudoSelectionPreset({name: entities.state.attributes.PresetSelectionStateAttribute.VALUE.MAX, value: 6})
        ];
        super({
            robot: options.robot,
            presets: presets
        });

        this.StateAttr = new stateAttrs.PresetSelectionStateAttribute({
            type: stateAttrs.PresetSelectionStateAttribute.TYPE.WATER_GRADE,
            value: stateAttrs.PresetSelectionStateAttribute.VALUE.MEDIUM
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

module.exports = MockWaterUsageControlCapability;
