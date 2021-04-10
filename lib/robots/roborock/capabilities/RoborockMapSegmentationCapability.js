const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");

/**
 * @extends MapSegmentationCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMapSegmentationCapability extends MapSegmentationCapability {
    /**
     * Could be phrased as "cleanSegments" for vacuums or "mowSegments" for lawnmowers
     *
     *
     * @param {Array<import("../../../entities/core/ValetudoMapSegment")>} segments
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments) {
        const segmentIds = segments.map(segment => parseInt(segment.id));

        //It might be interesting to know if we can send multiple objects in this array to have different repeat counts
        //in a single request

        await this.robot.sendCommand("app_segment_clean", [{"segments": segmentIds, "repeat": 1}], {});
    }
}

module.exports = RoborockMapSegmentationCapability;
