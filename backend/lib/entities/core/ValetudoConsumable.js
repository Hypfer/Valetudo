const SerializableEntity = require("../SerializableEntity");

class ValetudoConsumable extends SerializableEntity {
    /**
     * @param {object} options
     * @param {ValetudoConsumableType} options.type
     * @param {ValetudoConsumableSubType} [options.subType]
     * @param {object} [options.metaData]
     * @param {object} options.remaining
     * @param {number} options.remaining.value
     * @param {ValetudoConsumableRemainingUnit} options.remaining.unit
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.subType = options.subType ?? ValetudoConsumable.SUB_TYPE.NONE;

        this.remaining = options.remaining;
    }
}

/**
 *  @typedef {string} ValetudoConsumableType
 *  @enum {string}
 *
 */
ValetudoConsumable.TYPE = Object.freeze({
    FILTER: "filter",
    BRUSH: "brush",
    MOP: "mop",
    DETERGENT: "detergent",
    BIN: "bin",
    CLEANING: "cleaning",
});

/**
 *  @typedef {string} ValetudoConsumableSubType
 *  @enum {string}
 *
 */
ValetudoConsumable.SUB_TYPE = Object.freeze({
    NONE: "none",
    ALL: "all",
    MAIN: "main",
    SECONDARY: "secondary",
    SIDE_LEFT: "side_left",
    SIDE_RIGHT: "side_right",
    DOCK: "dock",
    SENSOR: "sensor",
    WHEEL: "wheel"
});

/**
 *
 * @typedef {string} ValetudoConsumableRemainingUnit
 * @enum {string}
 */
ValetudoConsumable.UNITS = Object.freeze({
    MINUTES: "minutes",
    PERCENT: "percent"
});


module.exports = ValetudoConsumable;
