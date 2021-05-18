const SerializableEntity = require("../../SerializableEntity");


class ValetudoNTPClientState extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {object} [options.metaData]
     * @class
     * @abstract
     */
    constructor(options) {
        super(options);

        this.timestamp = new Date();
    }
}

module.exports = ValetudoNTPClientState;
