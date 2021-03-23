const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class MapSegmentRenameCapability extends Capability {
    /**
     * @param {import("../../entities/core/ValetudoMapSegment")} segment
     * @param {string} name
     */
    async renameSegment(segment, name) {
        throw new NotImplementedError();
    }

    getType() {
        return MapSegmentRenameCapability.TYPE;
    }
}

MapSegmentRenameCapability.TYPE = "MapSegmentRenameCapability";

module.exports = MapSegmentRenameCapability;
