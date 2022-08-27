const StateAttribute = require("./StateAttribute");

class ConsumableStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {ConsumableStateAttributeType} options.type
     * @param {ConsumableStateAttributeSubType} [options.subType]
     * @param {object} [options.metaData]
     * @param {object} options.remaining
     * @param {number} options.remaining.value
     * @param {ConsumableStateAttributeRemainingUnit} options.remaining.unit
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.subType = options.subType ?? ConsumableStateAttribute.SUB_TYPE.NONE;

        this.remaining = options.remaining;
    }
}

/**
 *  @typedef {string} ConsumableStateAttributeType
 *  @enum {string}
 *
 */
ConsumableStateAttribute.TYPE = Object.freeze({
    FILTER: "filter",
    BRUSH: "brush",
    SENSOR: "sensor",
    MOP: "mop"
});

/**
 *  @typedef {string} ConsumableStateAttributeSubType
 *  @enum {string}
 *
 */
ConsumableStateAttribute.SUB_TYPE = Object.freeze({
    NONE: "none",
    ALL: "all",
    MAIN: "main",
    SECONDARY: "secondary",
    SIDE_LEFT: "side_left",
    SIDE_RIGHT: "side_right"
});

/**
 *
 * @typedef {string} ConsumableStateAttributeRemainingUnit
 * @enum {string}
 */
ConsumableStateAttribute.UNITS = Object.freeze({
    MINUTES: "minutes",
    PERCENT: "percent"
});


module.exports = ConsumableStateAttribute;
