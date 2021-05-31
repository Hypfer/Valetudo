const SerializableEntity = require("../SerializableEntity");

// noinspection JSCheckFunctionSignatures
class ValetudoMapSegment extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {string} options.id
     * @param {string} [options.name]
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.id = options.id;
        this.name = options.name;
    }
}

module.exports = ValetudoMapSegment;
