const StateAttribute = require("./StateAttribute");

class BatteryStateAttribute extends StateAttribute {
    /**
     * @param options {object}
     * @param options.level {number}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);

        this.level = options.level;
    }
}


module.exports = BatteryStateAttribute;