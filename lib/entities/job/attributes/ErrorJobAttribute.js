const JobAttribute = require("./JobAttribute");

class ErrorJobAttribute extends JobAttribute {
    /**
     * @param {object} options
     * @param {string} options.code
     * @param {string} [options.description]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.code = options.code;
        this.description = options.description;
    }
}


module.exports = ErrorJobAttribute;
