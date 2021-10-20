const ValetudoUpdaterState = require("./ValetudoUpdaterState");

class ValetudoUpdaterApplyPendingState extends ValetudoUpdaterState {
    /**
     *
     * @param {object} options
     * @param {object} [options.metaData]
     *
     * @param {string} options.version The version (e.g. 2021.10.0)
     * @param {Date}   options.releaseTimestamp The release date as found in the manifest
     * @param {string} options.downloadPath The path the new binary was downloaded to
     *
     * @class
     */
    constructor(options) {
        super(options);

        this.version = options.version;
        this.releaseTimestamp = options.releaseTimestamp;
        this.downloadPath = options.downloadPath;
    }
}

module.exports = ValetudoUpdaterApplyPendingState;
