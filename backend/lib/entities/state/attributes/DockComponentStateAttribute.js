const StateAttribute = require("./StateAttribute");

class DockComponentStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {DockComponentStateAttributeType} options.type 
     * @param {DockComponentStateAttributeValue} options.value
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.value = options.value;
    }
}


/**
 * @typedef {string} DockComponentStateAttributeType
 * @enum {string}
 */
DockComponentStateAttribute.TYPE = Object.freeze({
    WATER_TANK_CLEAN: "water_tank_clean",
    WATER_TANK_DIRTY: "water_tank_dirty",
    DUSTBAG: "dustbag",
    DETERGENT: "detergent"
});

/**
 * @typedef {string} DockComponentStateAttributeValue
 * @enum {string}
 */
DockComponentStateAttribute.VALUE = Object.freeze({
    OK: "ok",
    MISSING: "missing",
    EMPTY: "empty",
    FULL: "full",
    UNKNOWN: "unknown"
});


module.exports = DockComponentStateAttribute;
