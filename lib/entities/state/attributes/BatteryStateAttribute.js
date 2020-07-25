const StateAttribute = require("./StateAttribute");

class BatteryStateAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.level {number}
     * @param [options.flag] {BatteryStateAttributeFlag}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.level = options.level;
        this.flag = options.flag || BatteryStateAttribute.FLAG.NONE;
    }
}

/**
 *  @typedef {string} BatteryStateAttributeFlag
 *  @enum {string}
 *
 */
BatteryStateAttribute.FLAG = Object.freeze({
    NONE: "none",
    CHARGING: "charging",
    DISCHARGING: "discharging",
    CHARGED: "charged"
});


module.exports = BatteryStateAttribute;