const SerializableEntity = require("../SerializableEntity");

class ValetudoDataPoint extends SerializableEntity {
    /**
     * @param {object} options
     * @param {object} [options.metaData]
     * @param {Date} [options.timestamp]
     * @param {ValetudoDataPointType} options.type
     * @param {number} options.value
     */
    constructor(options) {
        super(options);

        this.timestamp = options.timestamp ?? new Date();

        this.type = options.type;
        this.value = options.value;
    }
}

/**
 *
 * @typedef {string} ValetudoDataPointType
 * @enum {string}
 */
ValetudoDataPoint.TYPES = Object.freeze({
    COUNT: "count",
    TIME: "time", //in seconds
    AREA: "area" //in cm²
});

module.exports = ValetudoDataPoint;
