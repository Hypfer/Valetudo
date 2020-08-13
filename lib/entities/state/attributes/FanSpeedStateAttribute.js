const StateAttribute = require("./StateAttribute");

class FanSpeedStateAttribute extends StateAttribute {
    /**
     * @param {object} options 
     * @param {FanSpeedStateAttributeValue} options.value 
     * @param {number} [options.customValue] 
     * @param {object} [options.metaData] 
     */
    constructor(options) {
        super(options);

        this.value = options.value;

        if (options.customValue) {
            if (this.value === FanSpeedStateAttribute.VALUE.CUSTOM) {
                this.customValue = options.customValue;
            } else {
                throw new Error("Custom Fanspeed value requires Fanspeed Value CUSTOM");
            }
        } else if (this.value === FanSpeedStateAttribute.VALUE.CUSTOM) {
            throw new Error("Missing custom value for CUSTOM fanspeed");
        }
    }
}

/**
 *  @typedef {string} FanSpeedStateAttributeValue
 *  @enum {string}
 *
 */
FanSpeedStateAttribute.VALUE = Object.freeze({
    OFF: "off",
    MIN: "min",
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    MAX: "max",
    CUSTOM: "custom"
});



module.exports = FanSpeedStateAttribute;