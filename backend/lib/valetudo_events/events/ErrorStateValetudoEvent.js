const DismissibleValetudoEvent = require("./DismissibleValetudoEvent");

class ErrorStateValetudoEvent extends DismissibleValetudoEvent {
    /**
     *
     *
     * @param {object}   options
     * @param {object}  options.message
     * @class
     */
    constructor(options) {
        super({});

        this.message = options.message;
    }
}

module.exports = ErrorStateValetudoEvent;
