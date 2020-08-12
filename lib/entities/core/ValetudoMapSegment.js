const SerializableEntity = require("../SerializableEntity");

// noinspection JSCheckFunctionSignatures
class ValetudoMapSegment extends SerializableEntity {
    /**
     *
     * @param options {object}
     * @param options.id {string}
     */
    constructor(options) {
        super(options);

        this.id = options.id;
    }
}

module.exports = ValetudoMapSegment;