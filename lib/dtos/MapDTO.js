/**
 * @param options {object}
 * @param [options.rawData] {Buffer}
 * @param [options.parsedData] {object}
 * @param [options.hash] {string}
 */
const MapDTO = function(options) { //TODO: needs jsdoc. maybe validation?
    this.rawData = options.rawData || null;
    this.parsedData = options.parsedData || null;
    this.hash = options.hash || null;
};

module.exports = MapDTO;