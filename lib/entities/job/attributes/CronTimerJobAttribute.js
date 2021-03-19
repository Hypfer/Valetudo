const JobAttribute = require("./JobAttribute");

class CronTimerJobAttribute extends JobAttribute {
    /**
     * @param {object} options
     * @param {boolean} options.enabled
     * @param {string} options.cron CRON expression
     *
     * @param {boolean} [options.repeat]
     * @param {boolean} [options.native]
     *
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.enabled = options.enabled;
        this.cron = options.cron;

        this.repeat = options.repeat !== undefined ? options.repeat : true;
        this.native = options.native !== undefined ? options.native : true; //TODO?
    }
}


module.exports = CronTimerJobAttribute;
