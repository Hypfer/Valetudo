const Capability = require("./Capability");
const MapLayer = require("../../entities/map/MapLayer");
const NotImplementedError = require("../NotImplementedError");
const ValetudoMapSegment = require("../../entities/core/ValetudoMapSegment");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MapSegmentationCapability extends Capability {
    /**
     * @returns {Promise<Array<import("../../entities/core/ValetudoMapSegment")>>}
     */
    async getSegments() {
        return this.robot.state.map.layers
            .filter(e => e.type === MapLayer.TYPE.SEGMENT)
            .map(e => new ValetudoMapSegment({
                id: e.metaData.segmentId,
                name: e.metaData.name
            })
            );
    }

    /**
     * Could be phrased as "cleanSegments" for vacuums or "mowSegments" for lawnmowers
     *
     *
     * @param {Array<import("../../entities/core/ValetudoMapSegment")>} segments
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments) {
        throw new NotImplementedError();
    }

    getType() {
        return MapSegmentationCapability.TYPE;
    }
}

MapSegmentationCapability.TYPE = "MapSegmentationCapability";

module.exports = MapSegmentationCapability;
