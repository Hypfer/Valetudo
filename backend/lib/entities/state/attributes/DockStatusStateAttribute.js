const StateAttribute = require("./StateAttribute");

class DockStatusStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {DockStatusStateAttributeValue} options.value
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.value = options.value;
    }
}

/**
 *  @typedef {string} DockStatusStateAttributeValue
 *  @enum {string}
 *
 */
DockStatusStateAttribute.VALUE = Object.freeze({
    ERROR: "error",
    IDLE: "idle",
    PAUSE: "pause",
    EMPTYING: "emptying",
    CLEANING: "cleaning",
    DRYING: "drying"
});


module.exports = DockStatusStateAttribute;
