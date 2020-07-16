const JobAttribute = require("./JobAttribute");

class ErrorJobAttribute extends JobAttribute {
    /**
     * @param options {object}
     * @param options.code {string}
     * @param [options.description] {string}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.code = options.code;
        this.description = options.description;
    }
}


module.exports = ErrorJobAttribute;