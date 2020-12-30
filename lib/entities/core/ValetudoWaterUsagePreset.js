const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoWaterUsagePreset extends SerializableEntity {
    /**
     * @param {object} options
     * @param {string} options.name
     * @param {any} options.value
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.name = options.name;
        this.value = options.value;
    }
}

module.exports = ValetudoWaterUsagePreset;
