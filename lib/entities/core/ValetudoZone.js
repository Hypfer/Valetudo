const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoZone extends SerializableEntity {
    /**
     * A ┌───┐ B
     *   │   │
     * D └───┘ C
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
     * @param {object} options.points.pC
     * @param {number} options.points.pC.x
     * @param {number} options.points.pC.y
     * @param {object} options.points.pD
     * @param {number} options.points.pD.x
     * @param {number} options.points.pD.y
     * @param {number} [options.iterations]
     * @param {object} [options.metaData]
     * @constructor
     */
    constructor(options) {
        super(options);

        this.points = options.points;
        this.iterations = options.iterations ? options.iterations : 1;
    }
}

module.exports = ValetudoZone;