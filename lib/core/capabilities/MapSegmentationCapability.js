const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class MapSegmentationCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<Array<import("../../entities/core/ValetudoMapSegment")>>}
     */
    async getSegments() {
        throw new NotImplementedError();
    }

    /**
     * Could be phrased as "cleanSegments" for vacuums or "mowSegments" for lawnmowers
     *
     *
     * @param segments {Array<import("../../entities/core/ValetudoMapSegment")>}
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments) {
        throw new NotImplementedError();
    }

    /**
     * @param segmentA {import("../../entities/core/ValetudoMapSegment")}
     * @param segmentB {import("../../entities/core/ValetudoMapSegment")}
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        throw new NotImplementedError();
    }

    /**
     * @param segment {import("../../entities/core/ValetudoMapSegment")}
     * @param x1 {number}
     * @param y1 {number}
     * @param x2 {number}
     * @param y2 {number}
     * @returns {Promise<void>}
     */
    async splitSegment(segment, x1,y1,x2,y2) {
        throw new NotImplementedError();
    }

    getType() {
        return MapSegmentationCapability.TYPE;
    }
}

MapSegmentationCapability.TYPE = "MapSegmentationCapability";

module.exports = MapSegmentationCapability;