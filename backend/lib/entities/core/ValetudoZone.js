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
     * @class
     */
    constructor(options) {
        super(options);

        this.points = options.points;
        this.iterations = options.iterations ? options.iterations : 1;

        if (
            !(
                this.points &&
                typeof this.points.pA?.x === "number" &&
                typeof this.points.pA?.y === "number" &&
                typeof this.points.pB?.x === "number" &&
                typeof this.points.pB?.y === "number" &&
                typeof this.points.pC?.x === "number" &&
                typeof this.points.pC?.y === "number" &&
                typeof this.points.pD?.x === "number" &&
                typeof this.points.pD?.y === "number"
            )
        ) {
            throw new Error("Invalid Zone points data");
        }
    }
}

module.exports = ValetudoZone;
