const crypto = require("crypto");

const mapEntities = require("./entities");
const MapLayer = require("./MapLayer");
const SerializableEntity = require("../SerializableEntity");
const ValetudoMapSegment = require("../core/ValetudoMapSegment");

/**
 * Represents a Valetudo standard issue map
 * including MapLayers and MapEntities
 *
 * Everything is int. Coordinates and size are in cm
 *
 * The origin is found in the top-left corner
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
     * @param {Array<import("./entities/MapEntity")>} options.entities
     * @param {any} [options.metaData]
     */
    constructor(options) {
        super(options);

        this.size = options.size;
        this.pixelSize = options.pixelSize;

        /** @type {Array<import("./MapLayer")>} */
        this.layers = [];
        /** @type {Array<import("./entities/MapEntity")>} */
        this.entities = [];

        this.metaData.version = 2;
        this.metaData.nonce = crypto.randomUUID();

        this.metaData.totalLayerArea = 0;

        this.addLayers(options.layers);
        this.addEntities(options.entities);
    }

    /**
     * @public
     * @param {import("./MapLayer")} layer
     */
    addLayer(layer) {
        layer.metaData.area = layer.dimensions.pixelCount * (this.pixelSize * this.pixelSize);

        this.metaData.totalLayerArea += layer.metaData.area;
        this.layers.push(layer);
    }

    /**
     * @public
     * @param {Array<import("./MapLayer")>} layers
     */
    addLayers(layers) {
        layers?.forEach(l => {
            return this.addLayer(l);
        });
    }

    /**
     * @public
     * @param {import("./entities/MapEntity")} entity
     */
    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * @public
     * @param {Array<import("./entities/MapEntity")>} entities
     */
    addEntities(entities) {
        entities?.forEach(e => {
            return this.addEntity(e);
        });
    }

    /**
     * @public
     * @return {Array<ValetudoMapSegment>}
     */
    getSegments() {
        return this.layers
            .filter(e => {
                return e.type === MapLayer.TYPE.SEGMENT;
            })
            .map(e => {
                let id = e.metaData.segmentId;

                if (typeof id === "number") {
                    // @ts-ignore
                    id = id.toString();
                }

                return new ValetudoMapSegment({
                    id: id,
                    name: e.metaData.name,
                    material: e.metaData.material
                });
            });
    }

    /**
     * @param {any} mapData
     * @returns {ValetudoMap}
     */
    static DESERIALIZE(mapData) {
        if (mapData.layers) {
            mapData.layers = mapData.layers.map(layer => {
                return new MapLayer({
                    type: layer.type,
                    pixels: MapLayer.DECOMPRESS_PIXELS(layer.compressedPixels),
                    metaData: layer.metaData
                });
            });
        }

        if (mapData.entities) {
            mapData.entities = mapData.entities.map(entity => {
                if (
                    entity.__class &&
                    Object.hasOwn(mapEntities, entity.__class) &&
                    typeof mapEntities[entity.__class] === "function"
                ) {
                    return new mapEntities[entity.__class](entity);
                }
                return entity;
            });
        }

        return new ValetudoMap(mapData);
    }
}

module.exports = ValetudoMap;
