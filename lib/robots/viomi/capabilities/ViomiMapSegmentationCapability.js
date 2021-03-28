const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const Logger = require("../../../Logger");
const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");

const attributes = require("../ViomiCommonAttributes");

/**
 * @extends MapSegmentationCapability<import("../ViomiValetudoRobot")>
 */
class ViomiMapSegmentationCapability extends MapSegmentationCapability {
    /**
     * @private
     * @returns {import("./ViomiBasicControlCapability")}
     */
    getBasicControlCapability() {
        return this.robot.capabilities[BasicControlCapability.TYPE];
    }

    /**
     * @param {Array<import("../../../entities/core/ValetudoMapSegment")>} segments
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments) {
        const segmentIds = segments.map(segment => parseInt(segment.id));
        Logger.trace("segments to clean: ", segmentIds);
        await this.getBasicControlCapability().setModeWithSegments(attributes.ViomiOperation.START, segmentIds);
    }
}

module.exports = ViomiMapSegmentationCapability;
