const SerializableEntity = require("../SerializableEntity");

/**
 * @swagger
 * components:
 *   schemas:
 *     ValetudoZone:
 *       type: object
 *       properties:
 *         iterations:
 *           type: number
 *         points:
 *           type: object
 *           properties:
 *             pA:
 *               $ref: "#/components/schemas/CoordinateDTO"
 *             pB:
 *               $ref: "#/components/schemas/CoordinateDTO"
 *             pC:
 *               $ref: "#/components/schemas/CoordinateDTO"
 *             pD:
 *               $ref: "#/components/schemas/CoordinateDTO"
 *         metaData:
 *           type: object
 */

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
    }
}

module.exports = ValetudoZone;
