const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const capabilities = require("../../core/capabilities");
const stateAttrs = require("../../entities/state/attributes");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");

class IntensityPresetCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/IntensityPresetCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[options.capability.getType()] + " control"
        }));
        this.capability = options.capability;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "intensity",
                friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[options.capability.getType()],
                datatype: DataType.ENUM,
                format: this.capability.getPresets().join(","),
                setter: async (value) => {
                    await this.capability.setIntensity(value);
                },
                getter: async () => {
                    const attr = this.robot.state.getFirstMatchingAttribute(CAPABILITIES_TO_STATE_ATTR_MAPPING[this.capability.getType()]);
                    if (attr === null) {
                        return null;
                    }
                    return attr.value;
                }
            }).also((prop) => {
                if (options.capability.getType() === capabilities.FanSpeedControlCapability.TYPE) {
                    // Sent as a topic reference since this is used for the autoconfig
                    HassAnchor.getTopicReference(HassAnchor.REFERENCE.FAN_SPEED_PRESETS)
                        .post(this.capability.getPresets()).then();
                    HassAnchor.getTopicReference(HassAnchor.REFERENCE.FAN_SPEED_SET)
                        .post(prop.getBaseTopic() + "/set").then();
                    HassAnchor.getTopicReference(HassAnchor.REFERENCE.FAN_SPEED)
                        .post(prop.getBaseTopic()).then();
                }
            })
        );
    }

    getInterestingStatusAttributes() {
        return [CAPABILITIES_TO_STATE_ATTR_MAPPING[this.capability.getType()]];
    }
}

const CAPABILITIES_TO_FRIENDLY_NAME_MAPPING = {
    [capabilities.FanSpeedControlCapability.TYPE]: "Fan speed",
    [capabilities.WaterUsageControlCapability.TYPE]: "Water grade",
};

const CAPABILITIES_TO_STATE_ATTR_MAPPING = {
    [capabilities.FanSpeedControlCapability.TYPE]: {
        attributeClass: stateAttrs.IntensityStateAttribute.name,
        attributeType: stateAttrs.IntensityStateAttribute.TYPE.FAN_SPEED
    },
    [capabilities.WaterUsageControlCapability.TYPE]: {
        attributeClass: stateAttrs.IntensityStateAttribute.name,
        attributeType: stateAttrs.IntensityStateAttribute.TYPE.WATER_GRADE
    },
};

module.exports = IntensityPresetCapabilityMqttHandle;
