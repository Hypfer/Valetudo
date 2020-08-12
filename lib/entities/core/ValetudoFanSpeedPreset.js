const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoFanSpeedPreset extends SerializableEntity {
    /**
     * @param options {object}
     * @param options.name {string}
     * @param options.value {any}
     * @constructor
     */
    constructor(options) {
        super(options);

        this.name = options.name;
        this.value = options.value;
    }
}

module.exports = ValetudoFanSpeedPreset;