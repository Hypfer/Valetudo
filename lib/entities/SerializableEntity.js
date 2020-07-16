class SerializableEntity {
    /**
     *
     * @param options {object}
     * @param [options.metaData] {object}
     */
    constructor(options) {
        this.__class = this.constructor.name;

        this.metaData = options.metaData || {};
    }
}

module.exports = SerializableEntity;