const StateAttribute = require("./StateAttribute");

class CleanSummaryAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {object} options.area
     * @param {number} options.area.value
     * @param {ConsumableStateAttributeRemaningUnit} options.area.unit
     * @param {object} options.hours
     * @param {number} options.hours.value
     * @param {ConsumableStateAttributeRemaningUnit} options.hours.unit
     * @param {object} options.count
     * @param {number} options.count.value
     */
    constructor(options) {
        super(options);

        this.area = options.area;
        this.hours = options.hours;
        this.count = options.count;
    }
}

/**
 *
 * @typedef {string} ConsumableStateAttributeRemaningUnit
 * @enum {string}
 */
CleanSummaryAttribute.UNITS = Object.freeze({
    MINUTES: "minutes",
    SQUARE_METRES: "square_metres"
});


module.exports = CleanSummaryAttribute;
