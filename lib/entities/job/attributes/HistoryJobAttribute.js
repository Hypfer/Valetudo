const JobAttribute = require("./JobAttribute");

class HistoryJobAttribute extends JobAttribute {
    /**
     * @param options {object}
     * @param [options.start] {Date}
     * @param [options.end] {Date}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.start = options.start;
        this.end = options.end;
    }
}


module.exports = HistoryJobAttribute;