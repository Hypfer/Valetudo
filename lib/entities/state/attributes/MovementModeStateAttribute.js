const StateAttribute = require("./StateAttribute");

class MovementModeStateAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.value {MovementModeAttributeValue}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.value = options.value;
    }
}

/**
 *  @typedef {string} MovementModeAttributeValue
 *  @enum {string}
 *
 */
MovementModeStateAttribute.VALUE = Object.freeze({
    REGULAR: "regular",
    MOP: "mop",
    OUTLINE: "outline"
});


module.exports = MovementModeStateAttribute;