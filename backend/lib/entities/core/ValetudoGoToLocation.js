const SerializableEntity = require("../SerializableEntity");


class ValetudoGoToLocation extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {object} options.coordinates
     * @param {number} options.coordinates.x
     * @param {number} options.coordinates.y
     * @param {object} [options.metaData]
     * @class
     */
    constructor(options) {
        super(options);

        this.coordinates = {
            x: options.coordinates.x,
            y: options.coordinates.y
        };

        if (
            !(
                this.coordinates &&
                typeof this.coordinates.x === "number" &&
                typeof this.coordinates.y === "number"
            )
        ) {
            throw new Error("Invalid coordinates");
        }

    }
}

module.exports = ValetudoGoToLocation;
