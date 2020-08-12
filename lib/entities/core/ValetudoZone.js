const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoZone extends SerializableEntity {
    /**
     * A ┌───┐ B
     *   │   │
     * D └───┘ C
     *
     *
     * @param options {object}
     * @param options.points {object}
     * @param options.points.pA {object}
     * @param options.points.pA.x {number}
     * @param options.points.pA.y {number}
     * @param options.points.pB {object}
     * @param options.points.pB.x {number}
     * @param options.points.pB.y {number}
     * @param options.points.pC {object}
     * @param options.points.pC.x {number}
     * @param options.points.pC.y {number}
     * @param options.points.pD {object}
     * @param options.points.pD.x {number}
     * @param options.points.pD.y {number}
     * @param [options.iterations] {number}
     * @constructor
     */
    constructor(options) {
        super(options);

        this.points = options.points;
        this.iterations = options.iterations ? options.iterations : 1;
    }
}

module.exports = ValetudoZone;