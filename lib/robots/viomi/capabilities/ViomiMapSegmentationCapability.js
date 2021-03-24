const Logger = require("../../../Logger");
const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");

/**
 * @extends MapSegmentationCapability<import("../ViomiValetudoRobot")>
 */
class ViomiMapSegmentationCapability extends MapSegmentationCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoMapSegment")>} segments
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments) {
        const segmentIds = segments.map(segment => segment.id);
        Logger.trace("segments to clean: ", segmentIds);

        await this.robot.sendCommand("set_mode_withroom", [0, 1, segmentIds.length, ...segmentIds], {});
    }
}

module.exports = ViomiMapSegmentationCapability;
