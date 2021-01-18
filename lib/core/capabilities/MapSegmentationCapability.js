const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");
const ValetudoMapSegment = require("../../entities/core/ValetudoMapSegment");
const MapLayer = require("../../entities/map/MapLayer");

class MapSegmentationCapability extends Capability {
    /**
     * @returns {Promise<Array<import("../../entities/core/ValetudoMapSegment")>>}
     */
    async getSegments() {
        return this.robot.state.map.layers
            .filter(e => e.type === MapLayer.TYPE.SEGMENT)
            .map(e => new ValetudoMapSegment({
                id: e.metaData.segmentId
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

    /**
     * @param {import("../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        throw new NotImplementedError();
    }

    /**
     * @param {import("../../entities/core/ValetudoMapSegment")} segment
     * @param {object} pA
     * @param {number} pA.x
     * @param {number} pA.y
     * @param {object} pB
     * @param {number} pB.x
     * @param {number} pB.y
     * @returns {Promise<void>}
     */
    async splitSegment(segment, pA, pB) {
        throw new NotImplementedError();
    }

    getType() {
        return MapSegmentationCapability.TYPE;
    }
}

MapSegmentationCapability.TYPE = "MapSegmentationCapability";

module.exports = MapSegmentationCapability;
