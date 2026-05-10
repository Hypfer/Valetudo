const MapEntity = require("./MapEntity");

class LineMapEntity extends MapEntity {
    /**
     *
     * @param {object} options 
     * @param {Array<number>} options.points 
     * @param {LineMapEntityType} options.type 
     * @param {object} [options.metaData] 
     */
    constructor(options) {
        super(options);
    }
}

/**
 *  @typedef {string} LineMapEntityType
 *  @enum {string}
 *
 */
LineMapEntity.TYPE = Object.freeze({
    VIRTUAL_WALL: "virtual_wall"
});


module.exports = LineMapEntity;
