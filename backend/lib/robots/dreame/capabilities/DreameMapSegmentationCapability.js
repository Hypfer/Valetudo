const MapSegmentationCapability = require("../../../core/capabilities/MapSegmentationCapability");

const DreameMiotHelper = require("../DreameMiotHelper");
const entities = require("../../../entities");

/**
 * @extends MapSegmentationCapability<import("../DreameValetudoRobot")>
 */
class DreameMapSegmentationCapability extends MapSegmentationCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
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
     * @param {number} options.iterationsSupported
     * @param {boolean} options.customOrderSupported
     * 
     * @param {boolean} [options.newOrder]
     */
    constructor(options) {
        super(options);

        this.miot_actions = options.miot_actions;
        this.miot_properties = options.miot_properties;

        this.segmentCleaningModeId = options.segmentCleaningModeId;
        this.iterationsSupported = options.iterationsSupported;
        this.customOrderSupported = options.customOrderSupported;

        this.newOrder = !!options.newOrder;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }
    /**
     *
     * @param {Array<import("../../../entities/core/ValetudoMapSegment")>} segments
     * @param {object} [options]
     * @param {number} [options.iterations]
     * @param {boolean} [options.customOrder]
     * @returns {Promise<void>}
     */
    async executeSegmentAction(segments, options) {
        const FanSpeedStateAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
            attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.FAN_SPEED
        });
        const WaterGradeAttribute = this.robot.state.getFirstMatchingAttribute({
            attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
            attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.WATER_GRADE
        });

        let fanSpeed = FanSpeedStateAttribute?.metaData?.rawValue ?? 1;
        let waterGrade = WaterGradeAttribute?.metaData?.rawValue ?? 1;


        const mappedSegments = segments.map((segment, i) => {
            return [
                parseInt(segment.id),
                typeof options?.iterations === "number" ? options.iterations : 1,
                fanSpeed,
                waterGrade,
                this.newOrder ? 1 : i + 1 // on older robots, this determines the order in which the segments should be cleaned
            ];
        });

        await this.helper.executeAction(
            this.miot_actions.start.siid,
            this.miot_actions.start.aiid,
            [
                {
                    piid: this.miot_properties.mode.piid,
                    value: this.segmentCleaningModeId
                },
                {
                    piid: this.miot_properties.additionalCleanupParameters.piid,
                    value: JSON.stringify({"selects": mappedSegments})
                }
            ]
        );
    }

    /**
     * @returns {import("../../../core/capabilities/MapSegmentationCapability").MapSegmentationCapabilityProperties}
     */
    getProperties() {
        return {
            iterationCount: {
                min: 1,
                max: this.iterationsSupported
            },
            customOrderSupport: this.customOrderSupported
        };
    }
}

module.exports = DreameMapSegmentationCapability;
