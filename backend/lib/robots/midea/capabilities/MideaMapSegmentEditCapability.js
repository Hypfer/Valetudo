const MapSegmentEditCapability = require("../../../core/capabilities/MapSegmentEditCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MapSegmentEditCapability<import("../MideaValetudoRobot")>
 */
class MideaMapSegmentEditCapability extends MapSegmentEditCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.JOIN_SEGMENTS,
                Buffer.from([
                    2, // count
                    parseInt(segmentA.id),
                    parseInt(segmentB.id)
                ])
            )
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        if (response.payload[3] !== 0x00) {
            throw new Error("Segment split failed.");
        } // TODO: should I do this with every command?


        this.robot.pollMap();
        await sleep(2_000);
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
        const pAm = this.robot.mapParser.convertToMideaCoordinates(pA.x, pA.y);
        const pBm = this.robot.mapParser.convertToMideaCoordinates(pB.x, pB.y);

        const payload = Buffer.alloc(9);
        payload.writeUInt16LE(pAm.x, 0);
        payload.writeUInt16LE(pAm.y, 2);
        payload.writeUInt16LE(pBm.x, 4);
        payload.writeUInt16LE(pBm.y, 6);

        payload[8] = parseInt(segment.id);

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SPLIT_SEGMENT,
                payload
            )
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        if (response.payload[3] !== 0x00) {
            throw new Error("Segment split failed.");
        }

        this.robot.pollMap();
        await sleep(2_000);
    }
}

module.exports = MideaMapSegmentEditCapability;
