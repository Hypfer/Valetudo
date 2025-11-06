const MapSegmentEditCapability = require("../../../core/capabilities/MapSegmentEditCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MapSegmentEditCapability<import("../MideaValetudoRobot")>
 */
class MideaMapSegmentEditCapabilityV1 extends MapSegmentEditCapability {
    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.JOIN_SEGMENTS,
                    2, // count
                    parseInt(segmentA.id),
                    parseInt(segmentB.id)
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());

        // To get error messages here, we would need to wait for an event of type 0x4c
        // because the firmware acknowledges the command with an echo, but only gives feedback with an event
        // There is no connection between our command and the feedback.
        //
        // Thus, no error reporting here :(


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

        const payload = Buffer.alloc(10);
        payload[0] = MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SPLIT_SEGMENTS;

        payload.writeUInt16LE(pAm.x, 1);
        payload.writeUInt16LE(pAm.y, 3);
        payload.writeUInt16LE(pBm.x, 5);
        payload.writeUInt16LE(pBm.y, 7);

        payload[9] = parseInt(segment.id);

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                payload
            )
        });


        await this.robot.sendCommand(packet.toHexString());

        // To get error messages here, we would need to wait for an event of type 0x4c
        // because the firmware acknowledges the command with an echo, but only gives feedback with an event
        // There is no connection between our command and the feedback.
        //
        // Thus, no error reporting here :(

        this.robot.pollMap();
        await sleep(2_000);
    }
}

module.exports = MideaMapSegmentEditCapabilityV1;
