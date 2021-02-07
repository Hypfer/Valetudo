const JobAttribute = require("./JobAttribute");

class StatisticsJobAttribute extends JobAttribute {
    /**
     * @param {object} options
     * @param {StatisticsJobAttributeType} options.type
     * @param {number} options.value
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.value = options.value;
    }
}

/**
 *  @typedef {string} StatisticsJobAttributeType
 *  @enum {string}
 *
 */
StatisticsJobAttribute.TYPE = Object.freeze({
    AREA: "area",        //cm²
    DURATION: "duration" //seconds
});


module.exports = StatisticsJobAttribute;
