const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoMapSnapshot extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {string} options.id
     * @param {Date} [options.timestamp]
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.id = options.id;
        this.timestamp = options.timestamp;
    }
}

module.exports = ValetudoMapSnapshot;
