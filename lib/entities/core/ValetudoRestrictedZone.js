const SerializableEntity = require("../SerializableEntity");

/**
 * @swagger
 * components:
 *   schemas:
 *     ValetudoRestrictedZone:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum:
 *             - regular
 *             - mop
 *         points:
 *           type: object
 *           properties:
 *             pA:
 *               $ref: "#/components/schemas/SizeDTO"
 *             pB:
 *               $ref: "#/components/schemas/SizeDTO"
 *             pC:
 *               $ref: "#/components/schemas/SizeDTO"
 *             pD:
 *               $ref: "#/components/schemas/SizeDTO"
 */

// noinspection JSUnusedGlobalSymbols
/**
 * @class ValetudoRestrictedZone
 * @property {object} points
 * @property {object} points.pA
 * @property {number} points.pA.x
 * @property {number} points.pA.y
 * @property {object} points.pB
 * @property {number} points.pB.x
 * @property {number} points.pB.y
 * @property {object} points.pC
 * @property {number} points.pC.x
 * @property {number} points.pC.y
 * @property {object} points.pD
 * @property {number} points.pD.x
 * @property {number} points.pD.y
 */
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
     * @param {ValetudoRestrictedZoneType} options.type
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.points = options.points;
        this.type = options.type;
    }
}

/**
 *  @typedef {string} ValetudoRestrictedZoneType
 *  @enum {string}
 *
 */
ValetudoRestrictedZone.TYPE = Object.freeze({
    REGULAR: "regular",
    MOP: "mop"
});

module.exports = ValetudoRestrictedZone;
