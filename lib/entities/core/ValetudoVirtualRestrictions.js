/**
 * @typedef {import("./ValetudoVirtualWall")} ValetudoVirtualWall
 * @typedef {import("./ValetudoRestrictedZone")} ValetudoRestrictedZone
 */

const SerializableEntity = require("../SerializableEntity");

/**
 * @swagger
 * components:
 *   schemas:
 *     ValetudoVirtualRestrictions:
 *       type: object
 *       properties:
 *         virtualWalls:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ValetudoVirtualWall"
 *         restrictedZones:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ValetudoRestrictedZone"
 */

// noinspection JSUnusedGlobalSymbols
/**
 * @class ValetudoVirtualRestrictions
 * @property {Array<ValetudoVirtualWall>} virtualWalls
 * @property {Array<ValetudoRestrictedZone>} restrictedZones
 */
class ValetudoVirtualRestrictions extends SerializableEntity {
    /**
     * This is a named container which contains RestrictedZones and virtualWalls
     *
     * @param {object} options
     * @param {Array<ValetudoVirtualWall>} options.virtualWalls
     * @param {Array<ValetudoRestrictedZone>} options.restrictedZones
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.virtualWalls = options.virtualWalls;
        this.restrictedZones = options.restrictedZones;
    }
}

module.exports = ValetudoVirtualRestrictions;
