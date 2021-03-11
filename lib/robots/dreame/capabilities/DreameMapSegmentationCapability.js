const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");
const DreameMapParser = require("../../../DreameMapParser");

class DreameMapSegmentationCapability extends MapSegmentationCapability {
    /**
     *
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {object} options.miot_actions
     * @param {object} options.miot_actions.start
     * @param {number} options.miot_actions.start.siid
     * @param {number} options.miot_actions.start.aiid
     *
     * @param {object} options.miot_actions.map_edit
     * @param {number} options.miot_actions.map_edit.siid
     * @param {number} options.miot_actions.map_edit.aiid
     *
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mode
     * @param {object} options.miot_properties.mode.piid
     * @param {object} options.miot_properties.additionalCleanupParameters
     * @param {number} options.miot_properties.additionalCleanupParameters.piid
     * @param {object} options.miot_properties.mapDetails
     * @param {number} options.miot_properties.mapDetails.piid
     * @param {object} options.miot_properties.actionResult
     * @param {number} options.miot_properties.actionResult.piid
     *
     * @param {number} options.segmentCleaningModeId
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;

        this.segmentCleaningModeId = options.segmentCleaningModeId;
    }
    /**
     *
     * @param {Array<import("../../../entities/core/ValetudoMapSegment")>} segments
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments) {
        const mappedSegments = segments.map(segment => {
            return [
                parseInt(segment.id),
                1, //maybe iterations?
                1, //fanSpeed. TODO Take current one from status!
                1, //Water Pump Intensity. TODO: Take current one from status!
                parseInt(segment.id) + 1 //no idea
            ];
        });

        const res = await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.start.siid,
                aiid: this.miot_actions.start.aiid,
                in: [
                    {
                        piid: this.miot_properties.mode.piid,
                        value: this.segmentCleaningModeId
                    },
                    {
                        piid: this.miot_properties.additionalCleanupParameters.piid,
                        value: JSON.stringify({"selects": mappedSegments})
                    }
                ]
            }
        );

        if (res.code !== 0) {
            throw new Error("Error code " + res.code);
        }
    }

    /**
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentA
     * @param {import("../../../entities/core/ValetudoMapSegment")} segmentB
     * @returns {Promise<void>}
     */
    async joinSegments(segmentA, segmentB) {
        await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify({
                            msr: [segmentA.id, segmentB.id]
                        })
                    }
                ]
            },
            {timeout: 5000}
        ).then(res => {
            if (
                res && res.siid === this.miot_actions.map_edit.siid &&
                res.aiid === this.miot_actions.map_edit.aiid &&
                Array.isArray(res.out) && res.out.length === 1 &&
                res.out[0].piid === this.miot_properties.actionResult.piid
            ) {
                switch (res.out[0].value) {
                    case 0:
                        return;
                    default:
                        throw new Error("Got error " + res.out[0].value + " while merging segments.");
                }
            }
        }).finally(() => {
            this.robot.pollMap();
        });
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

        await this.robot.sendCommand("action",
            {
                did: this.robot.deviceId,
                siid: this.miot_actions.map_edit.siid,
                aiid: this.miot_actions.map_edit.aiid,
                in: [
                    {
                        piid: this.miot_properties.mapDetails.piid,
                        value: JSON.stringify({
                            dsr: [pA.x, pA.y, pB.x, pB.y],
                            dsrid: [pA.x, pA.y, pB.x, pB.y, segment.id]
                        })
                    }
                ]
            },
            {timeout: 5000}
        ).then(res => {
            if (
                res && res.siid === this.miot_actions.map_edit.siid &&
                res.aiid === this.miot_actions.map_edit.aiid &&
                Array.isArray(res.out) && res.out.length === 1 &&
                res.out[0].piid === this.miot_properties.actionResult.piid
            ) {
                switch (res.out[0].value) {
                    case 0:
                        return;
                    default:
                        throw new Error("Got error " + res.out[0].value + " while splitting segments.");
                }
            }
        }).finally(() => {
            this.robot.pollMap();
        });
    }
}

module.exports = DreameMapSegmentationCapability;
