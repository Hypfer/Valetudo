const MapSegmentEditCapability = require("../../../core/capabilities/MapSegmentEditCapability");
const RRMapParser = require("../RRMapParser");

/**
 * @extends MapSegmentEditCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMapSegmentEditCapability extends MapSegmentEditCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        await this.robot.sendCommand("merge_segment", [segmentA.id, segmentB.id], {timeout: 5000}).finally(() => {
            this.robot.pollMap();
        });
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

        await this.robot.sendCommand("split_segment", flippedSplitLine, {timeout: 5000}).finally(() => {
            this.robot.pollMap();
        });
    }
}

module.exports = RoborockMapSegmentEditCapability;
