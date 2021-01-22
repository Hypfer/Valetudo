const SerializableEntity = require("../SerializableEntity");

// noinspection JSCheckFunctionSignatures
class ValetudoCarpetModeConfiguration extends SerializableEntity {
    /**
     * @param {object} options 
     * @param {boolean} options.enabled
     * @param {number} options.stall_time
     * @param {number} options.current_low
     * @param {number} options.current_high
     * @param {number} options.current_integral
     * @param {object} [options.metaData] 
     */
    constructor(options) {
        super(options);

        this.enabled = options.enabled;
        this.stall_time = options.stall_time;
        this.current_low = options.current_low;
        this.current_high = options.current_high;
        this.current_integral = options.current_integral;

    }
}

module.exports = ValetudoCarpetModeConfiguration;