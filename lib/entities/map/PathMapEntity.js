const MapEntity = require("./MapEntity");

class PathMapEntity extends MapEntity {
    /**
     *
     * @param options {object}
     * @param options.points {Array<number>}
     * @param options.type {PathMapEntityType}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        super(options);
    }
}

/**
 *  @typedef {string} PathMapEntityType
 *  @enum {string}
 *
 */
PathMapEntity.TYPE = Object.freeze({
    PATH: "path",
    PREDICTED_PATH: "predicted_path"
});

module.exports = PathMapEntity;