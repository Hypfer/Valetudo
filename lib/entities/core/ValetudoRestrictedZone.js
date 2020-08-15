const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoRestrictedZone extends SerializableEntity {
    /**
     * A ┌───┐ B
     *   │   │
     * D └───┘ C
     *
     * This could be extended to contain a type of restriction for e.g. having no-mop and no-vacuum zones
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
     * @param {object} [options.metaData]
     * @constructor
     */
    constructor(options) {
        super(options);

        this.points = options.points;
    }
}

module.exports = ValetudoRestrictedZone;