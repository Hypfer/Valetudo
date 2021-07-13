const MapSegmentRenameCapability = require("../../../core/capabilities/MapSegmentRenameCapability");

/**
 * @extends MapSegmentRenameCapability<import("../CecotecCongaRobot")>
 */
class CecotecMapSegmentRenameCapability extends MapSegmentRenameCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {string} name
     */
    async renameSegment(segment, name) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const map = this.robot.robot.device.map;

        if (!map) {
            throw new Error("There is no map in connected robot");
        }

        const room = map.rooms.find(room => room.id.toString() === String(segment.id));

        if (!room) {
            throw new Error(`There is no room with id '${segment.id}' in current map`);
        }

        this.robot.robot.updateRoom(room.clone({ name }));
        await this.robot.robot.updateMap();
    }
}

module.exports = CecotecMapSegmentRenameCapability;
