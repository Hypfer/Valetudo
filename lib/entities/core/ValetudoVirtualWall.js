const SerializableEntity = require("../SerializableEntity");


// noinspection JSUnusedGlobalSymbols
/**
 * @class ValetudoVirtualWall
 * @property {object} points
 * @property {object} points.pA
 * @property {number} points.pA.x
 * @property {number} points.pA.y
 * @property {object} points.pB
 * @property {number} points.pB.x
 * @property {number} points.pB.y
 */
class ValetudoVirtualWall extends SerializableEntity {
    /**
     * A ─── B
     *
     *
     * @param {object} options
     * @param {object} options.points
     * @param {object} options.points.pA
     * @param {number} options.points.pA.x
     * @param {number} options.points.pA.y
     * @param {object} options.points.pB
     * @param {number} options.points.pB.x
     * @param {number} options.points.pB.y
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.points = options.points;
    }
}

module.exports = ValetudoVirtualWall;