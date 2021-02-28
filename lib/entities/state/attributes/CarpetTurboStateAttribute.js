const StateAttribute = require("./StateAttribute");


/**
 * This may at some point also provide it's current capacity/fill level
 */

class CarpetTurboStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {CarpetTurboStateAttributeType} options.value
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.value = options.value;
    }
}

/**
 *  @typedef {string} CarpetTurboStateAttributeType
 *  @enum {string}
 *
 */
CarpetTurboStateAttribute.VALUE = Object.freeze({
    ENABLED: "enabled",
    DISABLED: "disabled"
});


module.exports = CarpetTurboStateAttribute;