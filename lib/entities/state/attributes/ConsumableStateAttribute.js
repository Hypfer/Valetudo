const StateAttribute = require("./StateAttribute");

class ConsumableStateAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.type {ConsumableStateAttributeType}
     * @param [options.subType] {ConsumableStateAttributeSubType}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.subType = options.subType || ConsumableStateAttribute.SUB_TYPE.NONE;
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
    SENSOR: "sensor"
});

/**
 *  @typedef {string} ConsumableStateAttributeSubType
 *  @enum {string}
 *
 */
ConsumableStateAttribute.SUB_TYPE = Object.freeze({
    NONE: "none",
    MAIN: "main",
    SIDE_LEFT: "side_left",
    SIDE_RIGHT: "side_right"
});


module.exports = ConsumableStateAttribute;