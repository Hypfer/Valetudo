const SerializableEntity = require("./SerializableEntity");



class Attribute extends SerializableEntity {
    /**
     * @param {object} options
     */
    constructor(options) {
        super(options);

        this.type = undefined;
        this.subType = undefined;
    }
}

module.exports = Attribute;