const MapSegmentRenameCapability = require("../../../core/capabilities/MapSegmentRenameCapability");

/**
 * @extends MapSegmentRenameCapability<import("../ViomiValetudoRobot")>
 */
class ViomiMapSegmentRenameCapability extends MapSegmentRenameCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {string} name
     */
    async renameSegment(segment, name) {
        if (this.robot.state.map?.metaData?.defaultMap === true) {
            throw new Error("Can't rename segment because the map was not parsed yet");
        }

        await this.robot.sendCommand("rename_room", [
            this.robot.state.map.metaData.vendorMapId,
            1,
            segment.id,
            name
        ],
        {
            timeout: 5000
        }).finally(() => {
            this.robot.pollMap();
        });
    }
}

module.exports = ViomiMapSegmentRenameCapability;
