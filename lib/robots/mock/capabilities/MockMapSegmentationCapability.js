const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");
const ValetudoMapSegment = require("../../../entities/core/ValetudoMapSegment");

/**
 * @extends MapSegmentationCapability<import("../MockRobot")>
 */
class MockMapSegmentationCapability extends MapSegmentationCapability {
    /**
     * @returns {Promise<Array<import("../../../entities/core/ValetudoMapSegment")>>}
     */
    async getSegments() {
        return [
            new ValetudoMapSegment({ id: "foo_id", name: "Foo"}),
            new ValetudoMapSegment({ id: "bar_id", name: "Bar"}),
            new ValetudoMapSegment({ id: "unnamed_id" })
        ];
    }

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
        await this.robot.capabilities.BasicControlCapability.start();
    }
}

module.exports = MockMapSegmentationCapability;

