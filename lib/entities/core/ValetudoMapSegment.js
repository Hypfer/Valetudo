const SerializableEntity = require("../SerializableEntity");

// noinspection JSCheckFunctionSignatures
class ValetudoMapSegment extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {string} options.id
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.id = options.id;
    }
}

module.exports = ValetudoMapSegment;
