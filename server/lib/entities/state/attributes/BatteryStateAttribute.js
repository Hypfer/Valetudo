const StateAttribute = require("./StateAttribute");

class BatteryStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {number} options.level
     * @param {BatteryStateAttributeFlag} [options.flag]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.level = options.level;
        this.flag = options.flag ?? BatteryStateAttribute.FLAG.NONE;
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
