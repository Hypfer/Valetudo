const JobAttribute = require("./JobAttribute");

class StatisticsJobAttribute extends JobAttribute {
    /**
     * @param options {object}
     * @param options.type {StatisticsJobAttributeType}
     * @param options.value {number}
     * @param [options.metaData] {object}
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