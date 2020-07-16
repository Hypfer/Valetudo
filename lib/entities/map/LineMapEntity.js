const MapEntity = require("./MapEntity");

class LineMapEntity extends MapEntity {
    /**
     *
     * @param options {object}
     * @param options.points {Array<number>}
     * @param options.type {LineMapEntityType}
     * @param [options.metaData] {object}
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