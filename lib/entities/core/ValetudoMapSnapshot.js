const SerializableEntity = require("../SerializableEntity");

/**
 * @swagger
 * components:
 *   schemas:
 *     ValetudoMapSnapshot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         timestamp:
 *           type: string
 *           description: "Datetime in ISO8601 format"
 *         map:
 *           $ref: "#/components/schemas/ValetudoMap"
 *         metaData:
 *           type: object
 */

// noinspection JSCheckFunctionSignatures
class ValetudoMapSnapshot extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {string} options.id
     * @param {Date} [options.timestamp]
     * @param {import("../map/ValetudoMap")} [options.map]
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.id = options.id;
        this.timestamp = options.timestamp;
        this.map = options.map;
    }
}

module.exports = ValetudoMapSnapshot;
