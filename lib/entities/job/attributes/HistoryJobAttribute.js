const JobAttribute = require("./JobAttribute");

class HistoryJobAttribute extends JobAttribute {
    /**
     * @param {object} options
     * @param {Date} [options.start]
     * @param {Date} [options.end]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.start = options.start;
        this.end = options.end;
    }
}


module.exports = HistoryJobAttribute;
