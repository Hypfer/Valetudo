const StateAttribute = require("./StateAttribute");

class StatusStateAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.value {StatusStateAttributeValue}
     * @param [options.flag] {StatusStateAttributeFlag}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.value = options.value;
        this.flag = options.flag || StatusStateAttribute.FLAG.NONE;
    }

    get isActiveState() {
        return [
            StatusStateAttribute.VALUE.RETURNING,
            StatusStateAttribute.VALUE.CLEANING,
            StatusStateAttribute.VALUE.MANUAL_CONTROL,
            StatusStateAttribute.VALUE.MOVING
        ].includes(this.value);
    }
}

/**
 *  @typedef {string} StatusStateAttributeValue
 *  @enum {string}
 *
 */
StatusStateAttribute.VALUE = Object.freeze({
    ERROR: "error",
    DOCKED: "docked",
    IDLE: "idle",
    RETURNING: "returning",
    CLEANING: "cleaning",
    PAUSED: "paused",
    MANUAL_CONTROL: "manual_control",
    MOVING: "moving"
});

/**
 *  @typedef {string} StatusStateAttributeFlag
 *  @enum {string}
 *
 */
StatusStateAttribute.FLAG = Object.freeze({
    NONE: "none",
    ZONE: "zone",
    SECTION: "section",
    SPOT: "spot",
    TARGET: "target",
    RESUMABLE: "resumable"
});


module.exports = StatusStateAttribute;