const StateAttribute = require("./StateAttribute");

class WaterUsageStateAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {WaterUsageStateAttributeValue} options.value
     * @param {number} [options.customValue]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.value = options.value;

        if (options.customValue) {
            if (this.value === WaterUsageStateAttribute.VALUE.CUSTOM) {
                this.customValue = options.customValue;
            } else {
                throw new Error("Custom water usage value requires water usage Value CUSTOM");
            }
        } else if (this.value === WaterUsageStateAttribute.VALUE.CUSTOM) {
            throw new Error("Missing custom value for CUSTOM water usage");
        }
    }
}

/**
 *  @typedef {string} WaterUsageStateAttributeValue
 *  @enum {string}
 *
 */
WaterUsageStateAttribute.VALUE = Object.freeze({
    OFF: "off",
    MIN: "min",
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    MAX: "max",
    CUSTOM: "custom"
});



module.exports = WaterUsageStateAttribute;