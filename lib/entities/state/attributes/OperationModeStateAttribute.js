const StateAttribute = require("./StateAttribute");

class OperationModeStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {OperationModeAttributeValue} options.value
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.value = options.value;
    }
}

/**
 *  @typedef {string} OperationModeAttributeValue
 *  @enum {string}
 *
 */
OperationModeStateAttribute.VALUE = Object.freeze({
    VACUUM: "vacuum",
    MOP: "mop",
    VACUUM_AND_MOP: "vacuum_and_mop"
});


module.exports = OperationModeStateAttribute;
