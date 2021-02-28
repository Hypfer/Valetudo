const SerializableEntity = require("../SerializableEntity");

/**
 * @class ValetudoSensor
 * @param {ValetudoSensorType} type
 * @param {ValetudoSensorSubType} [subType]
 */
class ValetudoSensor extends SerializableEntity {
    /**
     * @param {object} options
     * @param {ValetudoSensorType} options.type
     * @param {ValetudoSensorSubType} [options.subType]
     * @param {any} options.value
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.type = options.type;
        this.subType = options.subType;
        this.value = options.value;
        this.metadata = options.metaData;
    }
}

/**
 *  @typedef {string} ValetudoSensorType
 *  @enum {string}
 *
 */
ValetudoSensor.TYPE = Object.freeze({
    ALL: "all",
    ACCELEROMETER: "accelerometer",
    GYROSCOPE: "gyroscope",
    BUMPER: "bumper",
    CLIFF: "cliff",
    LIDAR: "lidar",
});

/**
 *  @typedef {string} ValetudoSensorSubType
 *  @enum {string}
 *
 */
ValetudoSensor.SUB_TYPE = Object.freeze({
});

module.exports = ValetudoSensor;