const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");

const entities = require("../../../entities");

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
     * @param {object} options.miot_properties
     * @param {object} options.miot_properties.mode
     * @param {object} options.miot_properties.mode.piid
     * @param {object} options.miot_properties.additionalCleanupParameters
     * @param {number} options.miot_properties.additionalCleanupParameters.piid
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
        const FanSpeedStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.IntensityStateAttribute.name,
            attributeType: entities.state.attributes.IntensityStateAttribute.TYPE.FAN_SPEED
        });
        const WaterGradeAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.IntensityStateAttribute.name,
            attributeType: entities.state.attributes.IntensityStateAttribute.TYPE.WATER_GRADE
        });

        let fanSpeed = FanSpeedStateAttribute?.metaData?.rawValue ?? 1;
        let waterGrade = WaterGradeAttribute?.metaData?.rawValue ?? 1;


        const mappedSegments = segments.map(segment => {
            return [
                parseInt(segment.id),
                1, //maybe iterations?
                fanSpeed,
                waterGrade,
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
}

module.exports = DreameMapSegmentationCapability;
