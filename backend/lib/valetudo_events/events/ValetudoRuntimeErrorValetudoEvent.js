const DismissibleValetudoEvent = require("./DismissibleValetudoEvent");

class ValetudoRuntimeErrorValetudoEvent extends DismissibleValetudoEvent {
    /**
     *
     * @param {object}   options
     * @param {string}   options.reason
     * @param {number}   options.generation
     * @param {string}   [options.description]
     * 
     * @param {string}  [options.id]
     * @param {Date}    [options.timestamp]
     * @param {boolean} [options.processed]
     * @param {object}  [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.reason = options.reason;
        this.generation = options.generation;
        this.description = options.description;
    }
}

ValetudoRuntimeErrorValetudoEvent.REASONS = Object.freeze({
    MEMORY_USAGE: "memory_usage"
});

module.exports = ValetudoRuntimeErrorValetudoEvent;
