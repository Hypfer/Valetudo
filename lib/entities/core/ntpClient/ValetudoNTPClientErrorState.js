const ValetudoNTPClientState = require("./ValetudoNTPClientState");

class ValetudoNTPClientErrorState extends ValetudoNTPClientState {
    /**
     * The NTP sync aborted with type, message at timestamp
     * 
     * @param {object}  options
     * @param {ValetudoNTPClientErrorType} options.type
     * @param {string}  options.message
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.message = options.message;
    }
}

/**
 *  @typedef {string} ValetudoNTPClientErrorType
 *  @enum {string}
 *
 */
ValetudoNTPClientErrorState.ERROR_TYPE = Object.freeze({
    UNKNOWN: "unknown",
    TRANSIENT: "transient",
    NAME_RESOLUTION: "name_resolution",
    CONNECTION: "connection",
    PERSISTING: "persisting"
});

module.exports = ValetudoNTPClientErrorState;
