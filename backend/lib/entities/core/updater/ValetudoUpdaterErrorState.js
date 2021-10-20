const ValetudoUpdaterState = require("./ValetudoUpdaterState");

class ValetudoUpdaterErrorState extends ValetudoUpdaterState {
    /**
     * The update process aborted with type, message at timestamp
     *
     * @param {object}  options
     * @param {ValetudoUpdaterErrorType} options.type
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
 *  @typedef {string} ValetudoUpdaterErrorType
 *  @enum {string}
 *
 */
ValetudoUpdaterErrorState.ERROR_TYPE = Object.freeze({
    UNKNOWN: "unknown",
    NOT_EMBEDDED: "not_embedded",
    NOT_DOCKED: "not_docked",
    NOT_WRITABLE: "not_writable",
    NOT_ENOUGH_SPACE: "not_enough_space",
    DOWNLOAD_FAILED: "download_failed",
    NO_RELEASE: "no_release",
    NO_MATCHING_BINARY: "no_matching_binary",
    INVALID_CHECKSUM: "invalid_checksum",
});

module.exports = ValetudoUpdaterErrorState;
