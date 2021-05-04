const SerializableEntity = require("./SerializableEntity");

/**
 * @swagger
 * components:
 *   schemas:
 *     Attribute:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *         subType:
 *           type: string
 *         metaData:
 *           type: object
 */

class Attribute extends SerializableEntity {
    /**
     * @param {object} options
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = undefined;
        this.subType = undefined;
    }
}

module.exports = Attribute;
