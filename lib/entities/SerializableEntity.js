class SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {object} [options.metaData]
     */
    constructor(options) {
        this.__class = this.constructor.name;

        this.metaData = options.metaData || {};
    }
}

module.exports = SerializableEntity;