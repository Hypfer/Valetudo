const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoDNDConfiguration extends SerializableEntity {
    /**
     * @param {object} options
     * @param {boolean} options.enabled
     * @param {object} options.start
     * @param {string} options.start.hour
     * @param {string} options.start.minute
     * @param {object} options.end
     * @param {string} options.end.hour
     * @param {string} options.end.minute
     * @param {object} [options.metaData]
     * 
     * @class 
     */
    constructor(options) {
        super(options);

        this.enabled = options.enabled;
        this.start = options.start;
        this.end = options.end;
    }
}

module.exports = ValetudoDNDConfiguration;