const SerializableEntity = require("../SerializableEntity");

// noinspection JSCheckFunctionSignatures
class ValetudoMapSegment extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {string} options.id
     * @param {string} [options.name]
     * @param {import("../map/MapLayer").MapLayerMaterial} [options.material]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.id = options.id;
        this.name = options.name;
        this.material = options.material;
    }
}

module.exports = ValetudoMapSegment;
