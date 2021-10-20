
class ValetudoReleaseBinary {
    /**
     *
     * @param {object} options
     * @param {string} options.name
     * @param {string} options.sha256sum
     * @param {string} options.downloadUrl
     */
    constructor(options) {
        this.name = options.name;
        this.sha256sum = options.sha256sum;
        this.downloadUrl = options.downloadUrl;
    }
}

module.exports = ValetudoReleaseBinary;
