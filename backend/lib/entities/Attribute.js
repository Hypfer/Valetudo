const SerializableEntity = require("./SerializableEntity");



class Attribute extends SerializableEntity {
    /**
     * @param {object} options
     * @param {object} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.type = undefined;
        this.subType = undefined;
    }

    /**
     *
     * @param {Attribute} otherAttribute
     * @return {boolean}
     */
    equals (otherAttribute) {
        return false;
    }
}

module.exports = Attribute;
