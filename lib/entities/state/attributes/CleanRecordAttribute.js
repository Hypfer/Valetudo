const StateAttribute = require("./StateAttribute");

class CleanRecordAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {object} options.startTime
     * @param {number} options.startTime.epoch
     * @param {Date} options.startTime.utc
     * @param {string} options.startTime.local
     * @param {object} options.finishTime
     * @param {number} options.finishTime.epoch
     * @param {Date} options.finishTime.utc
     * @param {string} options.finishTime.local
     * @param {object} options.duration
     * @param {number} options.duration.value
     * @param {CleanRecordAttributeUnit} options.duration.unit
     * @param {object} options.area
     * @param {number} options.area.value
     * @param {CleanRecordAttributeUnit} options.area.unit 
     * @param {object} options.error
     * @param {number} options.error.code
     * @param {string} options.error.description
     * @param {boolean} options.finishedFlag
     */
    constructor(options) {
        super(options);

        this.startTime = options.startTime;
        this.finishTime = options.finishTime;
        this.duration = options.duration;
        this.area = options.area;
        this.error = options.error;
        this.finishedFlag = options.finishedFlag;
    }
}

/**
 *
 * @typedef {string} CleanRecordAttributeUnit
 * @enum {string}
 */
CleanRecordAttribute.UNITS = Object.freeze({
    SECONDS: "seconds",
    SQUARE_METRES: "square_metres"
});


module.exports = CleanRecordAttribute;
