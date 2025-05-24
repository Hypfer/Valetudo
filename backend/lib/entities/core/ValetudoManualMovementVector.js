const SerializableEntity = require("../SerializableEntity");

/**
 * @class ValetudoManualMovementVector
 * @property {number} velocity -1 to 1
 * @property {number} angle -180 to 180
 */
class ValetudoManualMovementVector extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {number} options.velocity -1 to 1
     * @param {number} options.angle -180 to 180
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        if (options.velocity < -1 || options.velocity > 1) {
            throw new Error("Velocity must be between -1 and 1");
        }

        if (options.angle < -180 || options.angle > 180) {
            throw new Error("Angle must be between -180 and 180");
        }

        this.velocity = options.velocity;
        this.angle = options.angle;
    }
}

module.exports = ValetudoManualMovementVector;
