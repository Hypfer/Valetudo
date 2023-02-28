const MapEntity = require("./MapEntity");

class PointMapEntity extends MapEntity {
    /**
     *
     * @param {object} options
     * @param {Array<number>} options.points
     * @param {PointMapEntityType} options.type
     * @param {object} [options.metaData]
     * @param {number} [options.metaData.angle] 0-360°. 0° being North
     * @param {string} [options.metaData.label]
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
    GO_TO_TARGET: "go_to_target",
    OBSTACLE: "obstacle"
});

module.exports = PointMapEntity;
