const SerializableEntity = require("../SerializableEntity");

/**
 * A map layer is an array of pixels in a 2d space
 * Examples include Walls, Floor and Rooms
 *
 * Pixels are stored in a 1-dimensional array
 * e.g. [17,24,18,25] would be two pixels [17,24] and  [18,25]
 *
 * A Map can have multiple map layers.
 * All of them are required to use the same coordinate space as well as pixel size.
 *
 * Any viewport pixel shifting has to be done beforehand
 */
class MapLayer extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {MapLayerType} options.type
     * @param {Array<number>} options.pixels
     * @param {object} [options.metaData] //Probably something like name, id, whatever
     */
    constructor(options) {
        super(options);
        if (options.pixels.length === 0 || options.pixels.length % 2 !== 0) {
            throw new Error("Invalid pixels array");
        }

        if (!options.pixels.every(e => Number.isInteger(e))) {
            throw new Error("Only integer coordinates are allowed");
        }

        this.type = options.type;
        this.pixels = options.pixels;
        this.metaData = options.metaData ?? {};

        this.calculateDimensions();
    }

    /**
     * @private
     */
    calculateDimensions() {
        if (this.pixels.length > 0) {
            this.dimensions = {
                x: {
                    min: Infinity,
                    max: -Infinity,
                    mid: undefined
                },
                y: {
                    min: Infinity,
                    max: -Infinity,
                    mid: undefined
                }
            };

            for (let i = 0; i < this.pixels.length; i = i + 2) {
                if (this.pixels[i] < this.dimensions.x.min) {
                    this.dimensions.x.min = this.pixels[i];
                }

                if (this.pixels[i] > this.dimensions.x.max) {
                    this.dimensions.x.max = this.pixels[i];
                }

                if (this.pixels[i+1] < this.dimensions.y.min) {
                    this.dimensions.y.min = this.pixels[i+1];
                }

                if (this.pixels[i+1] > this.dimensions.y.max) {
                    this.dimensions.y.max = this.pixels[i+1];
                }
            }

            this.dimensions.x.mid = Math.round((
                this.dimensions.x.max +
                this.dimensions.x.min
            ) / 2);

            this.dimensions.y.mid = Math.round((
                this.dimensions.y.max +
                this.dimensions.y.min
            ) / 2);
        } else {
            this.dimensions = {
                x: {
                    min: 0,
                    max: 0,
                    mid: 0
                },
                y: {
                    min: 0,
                    max: 0,
                    mid: 0
                }
            };
        }
    }
}

/**
 *  @typedef {string} MapLayerType
 *  @enum {string}
 *
 */
MapLayer.TYPE = Object.freeze({
    FLOOR: "floor",
    WALL: "wall",
    SEGMENT: "segment"
});

module.exports = MapLayer;
