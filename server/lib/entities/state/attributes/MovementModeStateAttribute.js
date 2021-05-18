const StateAttribute = require("./StateAttribute");

class MovementModeStateAttribute extends StateAttribute {
    /**
     * @param {object} options 
     * @param {MovementModeAttributeValue} options.value 
     * @param {object} [options.metaData] 
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
