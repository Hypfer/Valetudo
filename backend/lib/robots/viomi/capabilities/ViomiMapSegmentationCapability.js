const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
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
     * @param {object} [options]
     * @param {number} [options.iterations]
     * @param {boolean} [options.customOrder]
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments, options) {
        const segmentIds = segments.map(segment => {
            return parseInt(segment.id);
        });

        if (options.iterations === 2) {
            await this.robot.sendCommand("set_repeat", [1], {});
        }

        await this.getBasicControlCapability().setModeWithSegments(attributes.ViomiOperation.START, segmentIds);
    }

    getProperties() {
        return {
            iterationCount: {
                min: 1,
                max: 2
            },
            customOrderSupport: false
        };
    }
}

module.exports = ViomiMapSegmentationCapability;
