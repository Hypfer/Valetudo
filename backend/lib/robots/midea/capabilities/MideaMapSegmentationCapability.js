const entities = require("../../../entities");
const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends MapSegmentationCapability<import("../MideaValetudoRobot")>
 */
class MideaMapSegmentationCapability extends MapSegmentationCapability {
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
        const OperationModeStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
            attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.OPERATION_MODE
        });

        const fanSpeed = FanSpeedStateAttribute?.metaData?.rawValue ?? 1;
        const waterGrade = WaterGradeAttribute?.metaData?.rawValue ?? 1;
        const operationMode = OperationModeStateAttribute?.metaData?.rawValue ?? 0;

        /*
            The J15 fw 413 expects a fixed-size payload for 10 room slots because it just ignores the length provided.
            A shorter payload causes a buffer over-read, leading to garbage rooms being added to the plan.

            The same bug does not exist in the zone payload handling, which does adhere to the length passed.
         */
        const segmentDataPayload = Buffer.alloc(1 + 10 * 10); // 1-byte count + 10 rooms * 10 bytes/room

        // On the J15 fw 413, this is being ignored by the robot :(
        segmentDataPayload[0] = segments.length;

        segments.slice(0, 10).forEach((segment, i) => {
            const offset = 1 + i * 10;

            segmentDataPayload[offset] = parseInt(segment.id);
            segmentDataPayload[offset + 1] = typeof options?.iterations === "number" ? options.iterations : 1;
            segmentDataPayload[offset + 2] = operationMode;
            // offset + 3 unknown
            segmentDataPayload[offset + 4] = fanSpeed;
            segmentDataPayload[offset + 5] = waterGrade;
            // remaining 4 bytes unknown
        });

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.START_SEGMENT_CLEANUP,
                segmentDataPayload
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

module.exports = MideaMapSegmentationCapability;
