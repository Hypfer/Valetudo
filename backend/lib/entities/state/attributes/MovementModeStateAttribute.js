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

    /**
     *
     * @param {MovementModeStateAttribute} otherAttribute
     * @return {boolean}
     */
    equals(otherAttribute) {
        return this.__class === otherAttribute.__class &&
            this.type === otherAttribute.type &&
            this.subType === otherAttribute.subType &&
            this.value === otherAttribute.value;
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
