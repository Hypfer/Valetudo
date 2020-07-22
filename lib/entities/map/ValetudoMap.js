const SerializableEntity = require("../SerializableEntity");

/**
 * Represents a Valetudo standard issue map
 * including MapLayers and MapEntities
 *
 * Everything is int. Coordinates and size are in cm
 *
 * The origin is found on the bottom-left corner like a mathematical coordinate system
 *
 */
class ValetudoMap extends SerializableEntity { //TODO: Current, Historic, Etc.
    /**
     *
     * @param options {object}
     * @param options.size {object}
     * @param options.size.x {number}
     * @param options.size.y {number}
     * @param options.pixelSize {number} in cm
     * @param options.layers {Array<import("./MapLayer")>}
     * @param options.entities {Array<import("./MapEntity")>}
     * @param [options.metaData] {object}
     * @param [options.metaData.defaultMap] {boolean}
     *
     * @constructor
     */
    constructor(options) {
        super(options);

        this.size = options.size;
        this.pixelSize = options.pixelSize;


        this.layers = [];
        this.entities = [];

        this.metaData.version = 1; //Will probably be incremented some day

        if (Array.isArray(options.layers)) {
            this.addLayers(options.layers);
        }

        if (Array.isArray(options.entities)) {
            this.addEntities(options.entities);
        }
    }

    /**
     * @public
     * @param layer {import("./MapLayer")}
     */
    addLayer(layer) {
        layer.metaData.area = (layer.pixels.length / 2) * (this.pixelSize * this.pixelSize);

        this.layers.push(layer);
    }

    /**
     * @public
     * @param layers {Array<import("./MapLayer")>}
     */
    addLayers(layers) {
        layers.forEach(l => this.addLayer(l));
    }

    /**
     * @public
     * @param entity {import("./MapEntity")}
     */
    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * @public
     * @param entities {Array<import("./MapEntity")>}
     */
    addEntities(entities) {
        entities.forEach(e => this.addEntity(e));
    }

    getIntersectingLayers(point) {
        //TODO
    }
}

module.exports = ValetudoMap;