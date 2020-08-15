const uuid = require("uuid");
const SerializableEntity = require("../SerializableEntity");


// noinspection JSCheckFunctionSignatures
class ValetudoGoToLocation extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {string} options.name
     * @param {object} options.coordinates
     * @param {number} options.corrdinates.x
     * @param {number} options.coordinates.y
     * @param {string} [options.id]
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