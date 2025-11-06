const entities = require("../../../entities");
const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends MapSegmentationCapability<import("../MideaValetudoRobot")>
 */
class MideaMapSegmentationCapabilityV1 extends MapSegmentationCapability {
    /**
     * @param {Array<import("../../../entities/core/ValetudoMapSegment")>} segments
     * @param {object} [options]
     * @param {number} [options.iterations]
     * @param {boolean} [options.customOrder]
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments, options) {
        if (segments.length > 10) {
            throw new Error("This robot can only clean a maximum of 10 segments at a time.");
        }

        const FanSpeedStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
            attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.FAN_SPEED
        });
        const WaterGradeAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
            attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.WATER_GRADE
        });

        const fanSpeed = FanSpeedStateAttribute?.metaData?.rawValue ?? 1;
        const waterGrade = WaterGradeAttribute?.metaData?.rawValue ?? 1;


        const segmentDataPayload = Buffer.alloc(1 + (2*10)); // 1-byte count + 10 * 2 bytes/room
        segmentDataPayload[0] = segments.length;

        segments.slice(0, 10).forEach((segment, i) => {
            const offset = 1 + i * 2;

            segmentDataPayload[offset] = parseInt(segment.id);
            segmentDataPayload[offset + 1] = typeof options?.iterations === "number" ? options.iterations : 1;
        });

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.concat([
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.START,
                        0x00,
                        0x02,
                        0x00,
                        0x0a, //segment cleaning
                        fanSpeed,
                        0x00, // unknown
                        waterGrade,
                    ]),
                    segmentDataPayload,
                    Buffer.from([0x00])

                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @returns {import("../../../core/capabilities/MapSegmentationCapability").MapSegmentationCapabilityProperties}
     */
    getProperties() {
        return {
            iterationCount: {
                min: 1,
                max: 3
            },
            customOrderSupport: false
        };
    }
}

module.exports = MideaMapSegmentationCapabilityV1;
