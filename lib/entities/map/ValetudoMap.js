const MapLayer = require("./MapLayer");
const SerializableEntity = require("../SerializableEntity");
const ValetudoMapSegment = require("../core/ValetudoMapSegment");

/**
 * Represents a Valetudo standard issue map
 * including MapLayers and MapEntities
 *
 * Everything is int. Coordinates and size are in cm
 *
 * The origin is found on the top-left corner
 *
 */
// TODO: add Swagger JSON schemas for children
/**
 * @swagger
 * components:
 *   schemas:
 *     ValetudoMap:
 *       type: object
 *       properties:
 *         size:
 *           $ref: "#/components/schemas/SizeDTO"
 *         pixelSize:
 *           type: integer
 *         layers:
 *           type: array
 *         entities:
 *           type: array
 *         metaData:
 *           type: object
 *           properties:
 *             version:
 *               type: number
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

        /** @type {Array<import("./MapLayer")>} */
        this.layers = [];
        /** @type {Array<import("./MapEntity")>} */
        this.entities = [];

        this.metaData.version = 1; // Will probably be incremented some day

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

    /**
     * @public
     * @return {Array<ValetudoMapSegment>}
     */
    getSegments() {
        return this.layers
            .filter(e => e.type === MapLayer.TYPE.SEGMENT)
            .map(e => {
                let id = e.metaData.segmentId;

                if (typeof id === "number") {
                    id = id.toString();
                }

                return new ValetudoMapSegment({
                    id: id,
                    name: e.metaData.name
                });
            });
    }

    getIntersectingLayers(point) {
        //TODO
    }
}

module.exports = ValetudoMap;
