const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");

/**
 * @extends MapSegmentationCapability<import("../RoborockValetudoRobot")>
 */
class RoborockMapSegmentSimpleCapability extends MapSegmentationCapability {
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
        const segmentIds = segments.map(segment => {
            return parseInt(segment.id);
        });

        await this.robot.sendCommand("app_segment_clean", segmentIds, {});
    }

    /**
     * @returns {import("../../../core/capabilities/MapSegmentationCapability").MapSegmentationCapabilityProperties}
     */
    getProperties() {
        return {
            iterationCount: {
                min: 1,
                max: 1
            },
            customOrderSupport: false
        };
    }
}

module.exports = RoborockMapSegmentSimpleCapability;
