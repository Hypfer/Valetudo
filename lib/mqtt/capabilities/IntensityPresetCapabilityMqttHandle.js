const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const capabilities = require("../../core/capabilities");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const stateAttrs = require("../../entities/state/attributes");
const {Commands} = require("../common");

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
                format: this.capability.getPresets()
                    // @ts-ignore
                    .concat(Object.values(Commands.INC_DEC))
                    .join(","),
                setter: async (value) => {
                    if (Object.values(Commands.INC_DEC).includes(value)) {
                        const presets = this.capability.getPresets();
                        const attr = this.robot.state.getFirstMatchingAttribute(CAPABILITIES_TO_STATE_ATTR_MAPPING[this.capability.getType()]);
                        if (attr === null) {
                            return;
                        }
                        let valueIndex = presets.indexOf(attr.value);
                        if (value === Commands.INC_DEC.INCREASE) {
                            valueIndex++;
                        } else {
                            valueIndex--;
                        }
                        if (valueIndex < 0 || valueIndex >= presets.length) {
                            return;
                        }
                        value = presets[valueIndex];
                    }
                    await this.capability.setIntensity(value);
                },
                getter: async () => {
                    const attr = this.robot.state.getFirstMatchingAttribute(CAPABILITIES_TO_STATE_ATTR_MAPPING[this.capability.getType()]);
                    if (attr === null) {
                        return null;
                    }
                    if (this.capability.getType() === capabilities.FanSpeedControlCapability.TYPE) {
                        await HassAnchor.getAnchor(HassAnchor.ANCHOR.FAN_SPEED)
                            .post(attr.value);
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
                } else if (options.capability.getType() === capabilities.WaterUsageControlCapability.TYPE) {
                    this.controller.withHass((hass) => {
                        prop.attachHomeAssistantComponent(
                            new InLineHassComponent({
                                hass: hass,
                                robot: this.robot,
                                name: capabilities.WaterUsageControlCapability.TYPE,
                                friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[capabilities.WaterUsageControlCapability.TYPE],
                                componentType: ComponentType.SENSOR,
                                baseTopicReference: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_WATER_GRADE_PRESETS),
                                autoconf: {
                                    state_topic: prop.getBaseTopic(),
                                    value_template: "{{ value }}",
                                    json_attributes_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_WATER_GRADE_PRESETS),
                                    json_attributes_template: "{{ value_json.attributes | to_json }}"
                                },
                                topics: {
                                    "": {attributes: {presets: this.capability.getPresets()}}
                                }
                            })
                        );
                    });

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
