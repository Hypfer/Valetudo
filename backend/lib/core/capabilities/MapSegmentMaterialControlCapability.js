const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

const MapLayer = require("../../entities/map/MapLayer");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MapSegmentMaterialControlCapability extends Capability {
    /**
     * @param {import("../../entities/core/ValetudoMapSegment")} segment
     * @param {MapLayerMaterial} material
     */
    async setMaterial(segment, material) {
        throw new NotImplementedError();
    }

    /**
     * @returns {{supportedMaterials: Array<MapLayerMaterial>}}
     */
    getProperties() {
        return {
            supportedMaterials: [MapSegmentMaterialControlCapability.MATERIAL.GENERIC]
        };
    }

    getType() {
        return MapSegmentMaterialControlCapability.TYPE;
    }
}

/**
 *  @typedef {string} MapLayerMaterial
 *  @enum {string}
 */
MapSegmentMaterialControlCapability.MATERIAL = MapLayer.MATERIAL;

MapSegmentMaterialControlCapability.TYPE = "MapSegmentMaterialControlCapability";

module.exports = MapSegmentMaterialControlCapability;
