const MapSegmentEditCapability = require("../../../core/capabilities/MapSegmentEditCapability");
const {Pixel} = require("@agnoc/core");

/**
 * @extends MapSegmentEditCapability<import("../CecotecCongaRobot")>
 */
class CecotecMapSegmentEditCapability extends MapSegmentEditCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const map = this.robot.robot.device.map;

        if (!map) {
            throw new Error("There is no map in connected robot");
        }

        const segmentIds = [segmentA, segmentB].map(segment => String(segment.id));
        const rooms = map.rooms.filter(room => segmentIds.includes(room.id.toString()));

        await this.robot.robot.joinRooms(rooms);
        await this.robot.robot.updateMap();
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segment
     * @param {object} pA
     * @param {number} pA.x
     * @param {number} pA.y
     * @param {object} pB
     * @param {number} pB.x
     * @param {number} pB.y
     * @returns {Promise<void>}
     */
    async splitSegment(segment, pA, pB) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const map = this.robot.robot.device.map;

        if (!map) {
            throw new Error("There is no map in connected robot");
        }

        const offset = map.size.y;
        const room = map.rooms.find(room => room.id.toString() === String(segment.id));
        const pointA = map.toCoordinate(new Pixel({
            x: pA.x,
            y: offset - pA.y
        }));
        const pointB = map.toCoordinate(new Pixel({
            x: pB.x,
            y: offset - pB.y
        }));

        await this.robot.robot.splitRoom(room, pointA, pointB);
        await this.robot.robot.updateMap();
    }
}

module.exports = CecotecMapSegmentEditCapability;
