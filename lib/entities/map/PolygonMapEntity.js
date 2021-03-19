const MapEntity = require("./MapEntity");

class PolygonMapEntity extends MapEntity {
    /**
     *
     * @param {object} options
     * @param {Array<number>} options.points
     * @param {PolygonMapEntityType} options.type
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);
    }
}

/**
 *  @typedef {string} PolygonMapEntityType
 *  @enum {string}
 *
 */
PolygonMapEntity.TYPE = Object.freeze({
    ACTIVE_ZONE: "active_zone",
    NO_GO_AREA: "no_go_area",
    NO_MOP_AREA: "no_mop_area"
});

module.exports = PolygonMapEntity;
