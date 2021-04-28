const StateAttribute = require("./StateAttribute");

class PresetSelectionStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {PresetSelectionStateAttributeType} options.type
     * @param {PresetSelectionStateAttributeValue} options.value
     * @param {number} [options.customValue]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.value = options.value;

        if (options.customValue) {
            if (this.value === PresetSelectionStateAttribute.VALUE.CUSTOM) {
                this.customValue = options.customValue;
            } else {
                throw new Error("Custom preset value requires value CUSTOM");
            }
        } else if (this.value === PresetSelectionStateAttribute.VALUE.CUSTOM) {
            throw new Error("Missing custom value for CUSTOM preset");
        }
    }
}

/**
 *  @typedef {string} PresetSelectionStateAttributeType
 *  @enum {string}
 *
 */
PresetSelectionStateAttribute.TYPE = Object.freeze({
    FAN_SPEED: "fan_speed",
    WATER_GRADE: "water_grade",
});

/**
 *  @typedef {string} PresetSelectionStateAttributeValue
 *  @enum {string}
 *
 */
PresetSelectionStateAttribute.VALUE = Object.freeze({
    OFF: "off",
    MIN: "min",
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    MAX: "max",
    TURBO: "turbo",
    CUSTOM: "custom",
});


module.exports = PresetSelectionStateAttribute;
