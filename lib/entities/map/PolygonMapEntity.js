const MapEntity = require("./MapEntity");

class PolygonMapEntity extends MapEntity {
    /**
     *
     * @param options {object}
     * @param options.points {Array<number>}
     * @param options.type {PolygonMapEntityType}
     * @param [options.metaData] {object}
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
    NO_GO_AREA: "no_go_area"
});

module.exports = PolygonMapEntity;