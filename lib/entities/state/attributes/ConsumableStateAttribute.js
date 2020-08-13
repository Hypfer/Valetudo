const StateAttribute = require("./StateAttribute");

class ConsumableStateAttribute extends StateAttribute {
    /**
     * @param {object} options 
     * @param {ConsumableStateAttributeType} options.type 
     * @param {ConsumableStateAttributeSubType} [options.subType] 
     * @param {object} [options.metaData] 
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