const ValetudoUpdaterState = require("./ValetudoUpdaterState");

class ValetudoUpdaterApprovalPendingState extends ValetudoUpdaterState {
    /**
     *
     * @param {object} options
     * @param {object} [options.metaData]
     *
     * @param {string} options.version The version to be installed (e.g. 2021.10.0)
     * @param {Date}   options.releaseTimestamp The release date as found in the manifest
     * @param {string} options.changelog Github flavoured Markdown
     * @param {string} options.downloadUrl The url from which the binary will be downloaded from
     * @param {string} options.expectedHash The expected sha256sum of the downloaded binary
     * @param {string} options.downloadPath The path the new binary is downloaded to
     *
     * @class
     */
    constructor(options) {
        super(options);

        this.version = options.version;
        this.releaseTimestamp = options.releaseTimestamp;
        this.changelog = options.changelog;
        this.downloadUrl = options.downloadUrl;
        this.expectedHash = options.expectedHash;
        this.downloadPath = options.downloadPath;
    }
}

module.exports = ValetudoUpdaterApprovalPendingState;
