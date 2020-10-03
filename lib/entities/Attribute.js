const SerializableEntity = require("./SerializableEntity");



class Attribute extends SerializableEntity {
    /**
     * @param {object} options
     */
    constructor(options) {
        super(options);

        this.type = undefined;
        this.subType = undefined;
        this.value = undefined;
    }

    toString() {
        let typespec = [this.type, this.subType].filter(x => x !== undefined).join("/");
        if (typespec) {
            typespec = `(${typespec})`;
        }
        if (this.value !== undefined) {
            typespec += ` = ${this.value}`;
        }
        return this.__class + typespec;
    }
}

module.exports = Attribute;