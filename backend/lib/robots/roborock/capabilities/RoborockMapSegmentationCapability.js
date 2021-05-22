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
     * @param {object} [options]
     * @param {number} [options.iterations]
     * @param {boolean} [options.customOrder]
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments, options) {
        const segmentIds = segments.map(segment => parseInt(segment.id));

        await this.robot.sendCommand("app_segment_clean", [{
            "segments": segmentIds,
            "repeat": options?.iterations ?? 1,
            "clean_order_mode": options?.customOrder === true ? 1 : 0
        }], {});
    }

    /**
     * @returns {import("../../../core/capabilities/MapSegmentationCapability").MapSegmentationCapabilityProperties}
     */
    getProperties() {
        return {
            iterationCount: {
                min: 1,
                max: 3
            },
            customOrderSupport: true
        };
    }
}

module.exports = RoborockMapSegmentationCapability;
