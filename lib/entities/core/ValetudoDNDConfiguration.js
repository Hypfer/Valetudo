const SerializableEntity = require("../SerializableEntity");

/**
 * @swagger
 * components:
 *   schemas:
 *     ValetudoDNDConfiguration:
 *       type: object
 *       properties:
 *         enabled:
 *           type: boolean
 *         start:
 *           $ref: "#/components/schemas/ScheduleTimeDTO"
 *         end:
 *           $ref: "#/components/schemas/ScheduleTimeDTO"
 *         metaData:
 *           type: object
 *
 */

// noinspection JSCheckFunctionSignatures
class ValetudoDNDConfiguration extends SerializableEntity {
    /**
     * @param {object} options
     * @param {boolean} options.enabled
     *
     * @param {object} options.start
     * @param {number} options.start.hour
     * @param {number} options.start.minute
     *
     * @param {object} options.end
     * @param {number} options.end.hour
     * @param {number} options.end.minute
     *
     * @param {object} [options.metaData]
     *
     * @class
     */
    constructor(options) {
        super(options);

        this.enabled = options.enabled;
        this.start = options.start;
        this.end = options.end;
    }
}

module.exports = ValetudoDNDConfiguration;
