const JobAttribute = require("./JobAttribute");

class CronTimerJobAttribute extends JobAttribute {
    /**
     * @param options {object}
     * @param options.enabled {boolean}
     * @param options.cron {string} CRON expression
     *
     * @param [options.repeat] {boolean}
     * @param [options.native] [boolean}
     *
     * @param [options.metaData] {object}
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