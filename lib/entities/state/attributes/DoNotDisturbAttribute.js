const StateAttribute = require("./StateAttribute");

class DoNotDisturbAttribute extends StateAttribute {
    /**
     * @param {object} options
     * @param {boolean} options.enabled
     * @param {object} options.start
     * @param {number} options.start.hour
     * @param {number} options.start.minute
     * @param {object} options.end
     * @param {number} options.end.hour
     * @param {number} options.end.minute
     */
    constructor(options) {
        super(options);

        this.enabled = options.enabled;
        this.start = options.start;
        this.end = options.end;
    }
}

module.exports = DoNotDisturbAttribute;
