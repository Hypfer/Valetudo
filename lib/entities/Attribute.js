const SerializableEntity = require("./SerializableEntity");



class Attribute extends SerializableEntity {
    /**
     * @param options {object}
     * @constructor
     */
    constructor(options) {
        super(options);

        this.type = undefined;
        this.subType = undefined;
    }
}

module.exports = Attribute;