const StateAttribute = require("./StateAttribute");

//TODO: This thing is temporary and will be replaced with the Job concept

class LatestCleanupStatisticsAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.type {LatestCleanupStatisticsAttributeType}
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
 *  @typedef {string} LatestCleanupStatisticsAttributeType
 *  @enum {string}
 *
 */
LatestCleanupStatisticsAttribute.TYPE = Object.freeze({
    AREA: "area",        //cm²
    DURATION: "duration" //seconds
});


module.exports = LatestCleanupStatisticsAttribute;