const MapSegmentRenameCapability = require("../../../core/capabilities/MapSegmentRenameCapability");

/**
 * @extends MapSegmentRenameCapability<import("../RoborockValetudoRobot")>
 */
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
        if (this.segmentNames === undefined) {
            throw new Error("Missing segmentNames in memory");
        }

        const payload = [
            {miRoomId: name, robotRoomId: parseInt(segment.id)}
        ];

        Object.keys(this.segmentNames).forEach(k => {
            if (parseInt(k) !== parseInt(segment.id)) {
                payload.push({
                    miRoomId: this.segmentNames[k],
                    robotRoomId: parseInt(k)
                });
            }
        });

        await this.robot.sendCommand("name_segment", payload, {timeout: 2500}).finally(() => {
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
