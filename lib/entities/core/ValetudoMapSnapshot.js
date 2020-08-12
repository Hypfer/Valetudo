const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoMapSnapshot extends SerializableEntity {
    /**
     *
     * @param options {object}
     * @param options.id {string}
     * @param [options.timestamp] {Date}
     * @param [options.map] {import("../map/ValetudoMap")}
     * @constructor
     */
    constructor(options) {
        super(options);

        this.id = options.id;
        this.timestamp = options.timestamp;
        this.map = options.map;
    }
}

module.exports = ValetudoMapSnapshot;