const MapEntity = require("./MapEntity");

class PathMapEntity extends MapEntity {
    /**
     *
     * @param {object} options
     * @param {Array<number>} options.points
     * @param {PathMapEntityType} options.type
     * @param {object} [options.metaData]
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