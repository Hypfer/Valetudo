const StateAttribute = require("./StateAttribute");

class OperationModeStateAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.value {OperationModeAttributeValue}
     * @param [options.metaData] {object}
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