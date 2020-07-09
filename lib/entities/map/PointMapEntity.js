const MapEntity = require("./MapEntity");

class PointMapEntity extends MapEntity {
    /**
     *
     * @param options {object}
     * @param options.points {Array<number>}
     * @param options.type {PointMapEntityType}
     * @param [options.metaData] {object}
     * @param [options.metaData.angle] {number} 0-360°. 0° being North
     */
    constructor(options) {
        super(options);

        if (this.points.length !== 2) {
            throw new Error("Coordinate count mismatch");
        }
    }
}


/**
 *  @typedef {string} PointMapEntityType
 *  @enum {string}
 *
 */
PointMapEntity.TYPE = Object.freeze({
    CHARGER_LOCATION: "charger_location",
    ROBOT_POSITION: "robot_position",
    GO_TO_TARGET: "go_to_target"
});

module.exports = PointMapEntity;