const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoVirtualWall extends SerializableEntity {
    /**
     * A ─── B
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
     * @constructor
     */
    constructor(options) {
        super(options);

        this.points = options.points;
    }
}

module.exports = ValetudoVirtualWall;