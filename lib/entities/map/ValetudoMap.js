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
     * @param {object} options
     * @param {object} options.size
     * @param {number} options.size.x in cm
     * @param {number} options.size.y in cm
     * @param {number} options.pixelSize in cm
     * @param {Array<import("./MapLayer")>} options.layers
     * @param {Array<import("./MapEntity")>} options.entities
     * @param {any} [options.metaData]
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
     * @param {import("./MapLayer")} layer
     */
    addLayer(layer) {
        layer.metaData.area = (layer.pixels.length / 2) * (this.pixelSize * this.pixelSize);

        this.layers.push(layer);
    }

    /**
     * @public
     * @param {Array<import("./MapLayer")>} layers
     */
    addLayers(layers) {
        layers.forEach(l => this.addLayer(l));
    }

    /**
     * @public
     * @param {import("./MapEntity")} entity
     */
    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * @public
     * @param {Array<import("./MapEntity")>} entities
     */
    addEntities(entities) {
        entities.forEach(e => this.addEntity(e));
    }

    getIntersectingLayers(point) {
        //TODO
    }
}

module.exports = ValetudoMap;
