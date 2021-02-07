const uuid = require("uuid");
const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoZonePreset extends SerializableEntity {
    /**
     * This is a named container which contains ValetudoZones
     *
     * @param {object} options
     * @param {string} options.name
     * @param {Array<import("./ValetudoZone")>} options.zones
     * @param {string} [options.id]
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.name = options.name;
        this.zones = options.zones;
        this.id = options.id || uuid.v4();
    }
}

module.exports = ValetudoZonePreset;
