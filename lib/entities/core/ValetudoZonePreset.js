const uuid = require("uuid");
const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoZonePreset extends SerializableEntity {
    /**
     * This is a named container which contains ValetudoZones
     *
     * @param options {object}
     * @param options.name {string}
     * @param options.zones {Array<import("./ValetudoZone")>}
     * @param [options.id] {string}
     * @constructor
     */
    constructor(options) {
        super(options);

        this.name = options.name;
        this.zones = options.zones;
        this.id = options.id || uuid.v4();
    }
}

module.exports = ValetudoZonePreset;