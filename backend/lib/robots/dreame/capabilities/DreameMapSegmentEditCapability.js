const DreameMapParser = require("../DreameMapParser");
const MapSegmentEditCapability = require("../../../core/capabilities/MapSegmentEditCapability");
const RobotFirmwareError = require("../../../core/RobotFirmwareError");

/**
 * @extends MapSegmentEditCapability<import("../DreameValetudoRobot")>
 */
class DreameMapSegmentEditCapability extends MapSegmentEditCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.map_edit
     * @param {number} options.miot_actions.map_edit.siid
     * @param {number} options.miot_actions.map_edit.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mapDetails
     * @param {number} options.miot_properties.mapDetails.piid
     * @param {object} options.miot_properties.actionResult
     * @param {number} options.miot_properties.actionResult.piid
     *
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify({
                            msr: [parseInt(segmentA.id), parseInt(segmentB.id)]
                        })
                    }
                ]
            },
            {timeout: 5000}
        );

        if (
            res && res.siid === this.miot_actions.map_edit.siid &&
            res.aiid === this.miot_actions.map_edit.aiid &&
            Array.isArray(res.out) && res.out.length === 1 &&
            res.out[0].piid === this.miot_properties.actionResult.piid
        ) {
            switch (res.out[0].value) {
                case 0:
                    this.robot.pollMap();
                    return;
                case 1:
                    throw new RobotFirmwareError("Segment join failed. Can't join segments that aren't adjacent to each other.");
                default:
                    throw new RobotFirmwareError("Got error " + res.out[0].value + " while merging segments.");
            }
        }
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
        pA = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(pA.x, pA.y);
        pB = DreameMapParser.CONVERT_TO_DREAME_COORDINATES(pB.x, pB.y);

        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify({
                            dsr: [pA.x, pA.y, pB.x, pB.y],
                            dsrid: [pA.x, pA.y, pB.x, pB.y, parseInt(segment.id)]
                        })
                    }
                ]
            },
            {timeout: 5000}
        );

        if (
            res && res.siid === this.miot_actions.map_edit.siid &&
            res.aiid === this.miot_actions.map_edit.aiid &&
            Array.isArray(res.out) && res.out.length === 1 &&
            res.out[0].piid === this.miot_properties.actionResult.piid
        ) {
            switch (res.out[0].value) {
                case 0:
                    this.robot.pollMap();
                    return;
                case 5:
                    throw new RobotFirmwareError("Failed to split segment. Both ends of the cutting line need to be connected with a wall surrounding the chosen segment.");
                case 6:
                    throw new RobotFirmwareError("Failed to split segment. At least one of the resulting segments is too small.");
                default:
                    throw new RobotFirmwareError("Got error " + res.out[0].value + " while splitting segments.");
            }
        }
    }
}

module.exports = DreameMapSegmentEditCapability;
