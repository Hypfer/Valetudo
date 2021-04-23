const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MapSegmentationCapability extends Capability {
    /**
     * @returns {Promise<Array<import("../../entities/core/ValetudoMapSegment")>>}
     */
    async getSegments() {
        return this.robot.state.map.getSegments();
    }

    /**
     * Could be phrased as "cleanSegments" for vacuums or "mowSegments" for lawnmowers
     *
     *
     * @param {Array<import("../../entities/core/ValetudoMapSegment")>} segments
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments) {
        throw new NotImplementedError();
    }

    getType() {
        return MapSegmentationCapability.TYPE;
    }
}

MapSegmentationCapability.TYPE = "MapSegmentationCapability";

module.exports = MapSegmentationCapability;
