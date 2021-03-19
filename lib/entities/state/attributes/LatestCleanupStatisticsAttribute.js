const StateAttribute = require("./StateAttribute");

//TODO: This thing is temporary and will be replaced with the Job concept

class LatestCleanupStatisticsAttribute extends StateAttribute {
    /**
     * @param {object} options 
     * @param {LatestCleanupStatisticsAttributeType} options.type 
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
 *  @typedef {string} LatestCleanupStatisticsAttributeType
 *  @enum {string}
 *
 */
LatestCleanupStatisticsAttribute.TYPE = Object.freeze({
    AREA: "area",        //cm²
    DURATION: "duration" //seconds
});


module.exports = LatestCleanupStatisticsAttribute;
