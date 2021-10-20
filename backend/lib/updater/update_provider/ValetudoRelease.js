
class ValetudoRelease {
    /**
     *
     * @param {object} options
     * @param {string} options.version
     * @param {Date}   options.releaseTimestamp
     * @param {string} options.changelog Github Flavoured Markdown
     *
     * @param {object} [options.metaData]
     */
    constructor(options) {
        this.version = options.version;
        this.releaseTimestamp = options.releaseTimestamp;
        this.changelog = options.changelog;

        this.metaData = options.metaData ?? {};
    }
}

module.exports = ValetudoRelease;
