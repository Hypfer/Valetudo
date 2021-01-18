const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");
const RRMapParser = require("../../../RRMapParser");

class RoborockMapSegmentationCapability extends MapSegmentationCapability {
    /**
     * Could be phrased as "cleanSegments" for vacuums or "mowSegments" for lawnmowers
     *
     *
     * @param {Array<import("../../../entities/core/ValetudoMapSegment")>} segments
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments) {
        const segmentIds = segments.map(segment => segment.id);

        //It might be interesting to know if we can send multiple objects in this array to have different repeat counts
        //in a single request

        await this.robot.sendCommand("app_segment_clean", [{"segments": segmentIds, "repeat": 1}], {});
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        await this.robot.sendCommand("merge_segment", [segmentA.id, segmentB.id], {timeout: 5000});
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {object} pA
     * @param {number} pA.x
     * @param {number} pA.y
     * @param {object} pB
     * @param {number} pB.x
     * @param {number} pB.y
     * @returns {Promise<void>}
     */
    async splitSegment(segment, pA, pB) {
        const flippedSplitLine = [
            segment.id,
            pA.x * 10,
            RRMapParser.DIMENSION_MM - pA.y * 10,
            pB.x * 10,
            RRMapParser.DIMENSION_MM - pB.y * 10
        ];

        await this.robot.sendCommand("split_segment", flippedSplitLine, {timeout: 5000});
    }
}

module.exports = RoborockMapSegmentationCapability;
