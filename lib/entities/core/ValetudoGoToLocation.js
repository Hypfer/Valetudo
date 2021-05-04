const SerializableEntity = require("../SerializableEntity");
const uuid = require("uuid");

/**
 * @swagger
 * components:
 *   schemas:
 *     ValetudoGoToLocation:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         coordinates:
 *           $ref: "#/components/schemas/SizeDTO"
 *         id:
 *           type: string
 *         metaData:
 *           type: object
 */
// noinspection JSCheckFunctionSignatures
class ValetudoGoToLocation extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {string} options.name
     * @param {object} options.coordinates
     * @param {number} options.coordinates.x
     * @param {number} options.coordinates.y
     * @param {string} [options.id]
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.name = options.name;
        this.coordinates = {
            x: options.coordinates.x,
            y: options.coordinates.y
        };
        this.id = options.id ?? uuid.v4();
    }
}

module.exports = ValetudoGoToLocation;
