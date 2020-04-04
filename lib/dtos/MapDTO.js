
class MapDTO {
    /**
     * @param {object} options
     * @param {Buffer} [options.rawData]
     * @param {object} [options.parsedData] //TODO: needs jsdoc. maybe validation?
     * @param {string} [options.hash]
     */
    constructor(options) {
        this.rawData = options.rawData || null;
        this.parsedData = options.parsedData || null;
        this.hash = options.hash || null;
    }
}

module.exports = MapDTO;