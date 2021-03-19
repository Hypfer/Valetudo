const StateAttribute = require("./StateAttribute");

class IntensityStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {IntensityStateAttributeType} options.type
     * @param {IntensityStateAttributeValue} options.value
     * @param {number} [options.customValue]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.value = options.value;

        if (options.customValue) {
            if (this.value === IntensityStateAttribute.VALUE.CUSTOM) {
                this.customValue = options.customValue;
            } else {
                throw new Error("Custom intensity value requires intensity value CUSTOM");
            }
        } else if (this.value === IntensityStateAttribute.VALUE.CUSTOM) {
            throw new Error("Missing custom value for CUSTOM intensity");
        }
    }
}

/**
 *  @typedef {string} IntensityStateAttributeType
 *  @enum {string}
 *
 */
IntensityStateAttribute.TYPE = Object.freeze({
    FAN_SPEED: "fan_speed",
    WATER_GRADE: "water_grade",
    CARPET_TURBO: "carpet_turbo"
});

/**
 *  @typedef {string} IntensityStateAttributeValue
 *  @enum {string}
 *
 */
IntensityStateAttribute.VALUE = Object.freeze({
    OFF: "off",
    MIN: "min",
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    MAX: "max",
    TURBO: "turbo",
    CUSTOM: "custom",
});


module.exports = IntensityStateAttribute;
