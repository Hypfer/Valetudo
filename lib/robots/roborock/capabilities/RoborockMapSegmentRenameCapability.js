const MapSegmentRenameCapability = require("../../../core/capabilities/MapSegmentRenameCapability");

class RoborockMapSegmentRenameCapability extends MapSegmentRenameCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {string} name
     * @returns {Promise<void>}
     */
    async renameSegment(segment, name) {
        if (!name || name?.length > 23) {
            throw new Error("Invalid name. Max length 23");
        }

        await this.robot.sendCommand("name_segment", [{miRoomId: name, robotRoomId: segment.id}], {timeout: 10000}).finally(() => {
            this.fetchAndStoreSegmentNames().finally(() => {
                this.robot.pollMap();
            });
        });
    }

    /**
     * This is a roborock-specific method which fetches the segment names and stores them
     * in the capability, which is somewhat ugly but not as ugly as other solutions considered
     *
     * @returns {Promise<void>}
     */
    async fetchAndStoreSegmentNames() {
        const segmentNames = await this.robot.sendCommand("get_room_mapping");

        // Example response: [ [ 21, 'RoomName' ] ]
        if (Array.isArray(segmentNames)) {
            this.segmentNames = {};

            segmentNames.forEach(s => {
                this.segmentNames[s[0]] = s[1];
            });
        } else {
            this.segmentNames = null;
        }
    }
}

module.exports = RoborockMapSegmentRenameCapability;
