/**
 * @param options {object}
 * @param [options.rawData] {Buffer} //seems to be not used anywhere
 * @param [options.parsedData] {object}
 * @param [options.hash] {string}
 */
const MapDTO = function(options) { //TODO: needs jsdoc. maybe validation?
//    this.rawData = options.rawData || null; //seems to be not used anywhere
    this.parsedData = options.parsedData || null;
    this.hash = options.hash || null;
};

module.exports = MapDTO;