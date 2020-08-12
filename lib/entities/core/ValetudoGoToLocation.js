const uuid = require("uuid");
const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoGoToLocation extends SerializableEntity {
    /**
     *
     * @param options {object}
     * @param options.name {string}
     * @param options.coordinates {object}
     * @param options.corrdinates.x {number}
     * @param options.coordinates.y {number}
     * @param [options.id] {string}
     * @constructor
     */
    constructor(options) {
        super(options);

        this.name = options.name;
        this.coordinates = {
            x: options.coordinates.x,
            y: options.coordinates.y
        };
        this.id = options.id || uuid.v4();
    }
}

module.exports = ValetudoGoToLocation;