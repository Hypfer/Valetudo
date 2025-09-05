const crypto = require("crypto");

const MapLayer = require("./MapLayer");
const PointMapEntity = require("./PointMapEntity");
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
                    id = id.toString();
                }

                return new ValetudoMapSegment({
                    id: id,
                    name: e.metaData.name
                });
            });
    }

    /**
     * Find the segment at a given absolute position in cm.
     * Returns {id, name} or null if not found.
     *
     * @public
     * @param {number} xCm
     * @param {number} yCm
     * @returns {{id: string, name: string}|null}
     */
    getSegmentAtPoint(xCm, yCm) {
        if (typeof xCm !== "number" || typeof yCm !== "number" || typeof this.pixelSize !== "number") {
            return null;
        }

        const px = Math.round(xCm / this.pixelSize);
        const py = Math.round(yCm / this.pixelSize);

        for (const layer of this.layers) {
            if (!layer || layer.type !== MapLayer.TYPE.SEGMENT || !layer.metaData || !Array.isArray(layer.compressedPixels)) {
                continue;
            }

            const dims = layer.dimensions;
            if (!dims) {
                continue;
            }

            if (px < dims.x.min || px > dims.x.max || py < dims.y.min || py > dims.y.max) {
                continue;
            }

            const cp = layer.compressedPixels; // [xStart, y, count] triplets
            for (let i = 0; i < cp.length; i += 3) {
                const xStart = cp[i];
                const y = cp[i + 1];
                const count = cp[i + 2];

                if (y === py) {
                    if (px >= xStart && px < xStart + count) {
                        const id = typeof layer.metaData.segmentId === "number" ? layer.metaData.segmentId.toString() : layer.metaData.segmentId;
                        const name = layer.metaData.name ?? id ?? "";

                        if (id) {
                            return {id: id, name: name};
                        }
                    }
                } else if (y > py) {
                    break;
                }
            }
        }

        return null;
    }

    /**
     * Return the segment at the current robot position, if available.
     * Returns {id, name} or null.
     *
     * @public
     * @returns {{id: string, name: string}|null}
     */
    getRobotPositionSegment() {
        const robotPos = this.entities.find(e => {
            return e && e.type === PointMapEntity.TYPE.ROBOT_POSITION && Array.isArray(e.points) && e.points.length === 2;
        });

        if (!robotPos) {
            return null;
        }

        return this.getSegmentAtPoint(robotPos.points[0], robotPos.points[1]);
    }
}

module.exports = ValetudoMap;
