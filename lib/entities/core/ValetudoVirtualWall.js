const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
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
     * @constructor
     */
    constructor(options) {
        super(options);

        this.points = options.points;
    }
}

module.exports = ValetudoVirtualWall;