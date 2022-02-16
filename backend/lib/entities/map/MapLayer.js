const SerializableEntity = require("../SerializableEntity");

/**
 * A map layer is an array of pixels in a 2d space
 * Examples include Walls, Floor and Rooms
 *
 * Pixels were originally stored in a 1-dimensional array
 * e.g. [17,24,18,25] would be two pixels [17,24] and [18,25]
 *
 * To save memory and bandwidth, CompressedPixels are stored in a RLE fashion
 * [37, 5, 3] maps to the three plain pixels [37,5], [38,5] and [39,5]
 *
 * A Map can have multiple map layers.
 * All of them are required to use the same coordinate space as well as pixel size.
 *
 * Any viewport pixel shifting has to be done beforehand
 * Pixel coordinates must be integers
 */
class MapLayer extends SerializableEntity {
    /**
     *
     * @param {object} options
     * @param {MapLayerType} options.type
     * @param {Array<number>} options.pixels These have to be sorted for the compression to work. Unsorted pixel compressed maps will become larger than uncompressed ones
     * @param {object} [options.metaData] Probably something like name, id, whatever
     */
    constructor(options) {
        super(options);

        if (options.pixels.length === 0 || options.pixels.length % 2 !== 0) {
            throw new Error(`Invalid pixels array. Pixel count: ${options.pixels.length}`);
        }

        this.type = options.type;
        this.pixels = [];
        this.metaData = options.metaData ?? {};

        this.calculateDimensions(options.pixels);
        this.compressPixels(options.pixels);
    }

    /**
     * @param {Array<number>} pixels
     * @private
     */
    calculateDimensions(pixels) {
        const sums = {
            x: 0,
            y: 0
        };

        this.dimensions = {
            x: {
                min: Infinity,
                max: -Infinity,
                mid: undefined,
                avg: undefined
            },
            y: {
                min: Infinity,
                max: -Infinity,
                mid: undefined,
                avg: undefined
            },
            pixelCount: pixels.length / 2
        };

        for (let i = 0; i < pixels.length; i = i + 2) {
            sums.x += pixels[i];
            sums.y += pixels[i+1];

            if (pixels[i] < this.dimensions.x.min) {
                this.dimensions.x.min = pixels[i];
            }

            if (pixels[i] > this.dimensions.x.max) {
                this.dimensions.x.max = pixels[i];
            }

            if (pixels[i+1] < this.dimensions.y.min) {
                this.dimensions.y.min = pixels[i+1];
            }

            if (pixels[i+1] > this.dimensions.y.max) {
                this.dimensions.y.max = pixels[i+1];
            }
        }

        /*
            By only checking these two sums instead of all individual coordinates, we can save a lot of cpu cycles

            The downside of this approach is that we might miss invalid (containing non-integer coordinate) pixels arrays,
            because the sums added up to an integer. That's an acceptable trade-off though
         */
        if (!(Number.isInteger(sums.x) && Number.isInteger(sums.y))) {
            throw new Error("Only integer coordinates are allowed");
        }


        this.dimensions.x.mid = Math.round((
            this.dimensions.x.max +
            this.dimensions.x.min
        ) / 2);

        this.dimensions.y.mid = Math.round((
            this.dimensions.y.max +
            this.dimensions.y.min
        ) / 2);

        this.dimensions.x.avg = Math.round(sums.x / (pixels.length/2));
        this.dimensions.y.avg = Math.round(sums.y / (pixels.length/2));
    }

    /**
     * @param {Array<number>} pixels
     * @private
     */
    compressPixels(pixels) {
        const currentBlock = {
            xStart: -Infinity,
            y: -Infinity,
            count: 0
        };
        const compressedPixels = [];

        for (let i = 0; i < pixels.length; i = i + 2) {
            const x = pixels[i];
            const y = pixels[i + 1];

            if (y !== currentBlock.y || x > currentBlock.xStart + currentBlock.count) {
                compressedPixels.push(currentBlock.xStart, currentBlock.y, currentBlock.count);

                currentBlock.xStart = x;
                currentBlock.y = y;
                currentBlock.count = 1;
            } else if (x !== currentBlock.xStart) {
                currentBlock.count++;
            }
        }

        //Add final block
        compressedPixels.push(currentBlock.xStart, currentBlock.y, currentBlock.count);
        //remove first bogus elements
        compressedPixels.splice(0, 3);

        this.compressedPixels = compressedPixels;
    }
}

MapLayer.COORDINATE_TUPLE_SORT = (a, b) => {
    const xA = a[0];
    const yA = a[1];
    const xB = b[0];
    const yB = b[1];

    if (yB > yA) {
        return -1;
    } else if (xB > xA) {
        return 1;
    } else {
        return 0;
    }
};

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
