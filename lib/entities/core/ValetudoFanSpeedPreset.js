const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoFanSpeedPreset extends SerializableEntity {
    /**
     * @param {object} options
     * @param {string} options.name
     * @param {any} options.value
     * @param {object} [options.metaData]
     * @constructor
     */
    constructor(options) {
        super(options);

        this.name = options.name;
        this.value = options.value;
    }
}

module.exports = ValetudoFanSpeedPreset;