const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const capabilities = require("../../core/capabilities");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const stateAttrs = require("../../entities/state/attributes");
const {Commands} = require("../common");

class PresetSelectionCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/PresetSelectionCapability")} options.capability
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
                topicName: "preset",
                friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[options.capability.getType()],
                datatype: DataType.ENUM,
                format: this.capability.getPresets().join(","),
                setter: async (value) => {
                    if (Object.values(Commands.INC_DEC).includes(value)) {
                        const presets = this.capability.getPresets();
                        const attr = this.robot.state.getFirstMatchingAttribute(CAPABILITIES_TO_STATE_ATTR_MAPPING[this.capability.getType()]);
                        if (attr === null) {
                            return;
                        }
                        let valueIndex = presets.indexOf(attr.value);
                        if (valueIndex < 0 || valueIndex >= presets.length) {
                            return;
                        }
                        value = presets[valueIndex];
                    }
                    await this.capability.selectPreset(value);
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
                },
                helpText: "This handle allows setting the " +
                    CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[options.capability.getType()].toLowerCase() + ". " +
                    "It accepts the preset payloads specified in `$format` or in the HAss json attributes.",
                helpMayChange: {
                    "Enum payloads": "Different robot models have different " +
                        CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[options.capability.getType()].toLowerCase() +
                        " presets. Always check `$format`/`json_attributes` during startup."
                }
            }).also((prop) => {
                if (options.capability.getType() === capabilities.FanSpeedControlCapability.TYPE) {
                    // Sent as a topic reference since this is used for the autoconfig
                    HassAnchor.getTopicReference(HassAnchor.REFERENCE.FAN_SPEED_PRESETS)
                        .post(this.capability.getPresets()).then();
                    HassAnchor.getTopicReference(HassAnchor.REFERENCE.FAN_SPEED_SET)
                        .post(prop.getBaseTopic() + "/set").then();
                } else {
                    this.controller.withHass((hass) => {
                        prop.attachHomeAssistantComponent(
                            new InLineHassComponent({
                                hass: hass,
                                robot: this.robot,
                                name: this.capability.getType(),
                                friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[this.capability.getType()],
                                componentType: ComponentType.SENSOR,
                                baseTopicReference: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_PRESET_SELECTION_PRESETS + "_" + this.capability.getType()),
                                autoconf: {
                                    state_topic: prop.getBaseTopic(),
                                    value_template: "{{ value }}",
                                    json_attributes_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_PRESET_SELECTION_PRESETS + "_" + this.capability.getType()),
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
    [capabilities.MovementModeSelectionCapability.TYPE]: "Movement mode",
    [capabilities.WaterUsageControlCapability.TYPE]: "Water grade",
};

const CAPABILITIES_TO_STATE_ATTR_MAPPING = {
    [capabilities.FanSpeedControlCapability.TYPE]: {
        attributeClass: stateAttrs.PresetSelectionStateAttribute.name,
        attributeType: stateAttrs.PresetSelectionStateAttribute.TYPE.FAN_SPEED
    },
    [capabilities.MovementModeSelectionCapability.TYPE]: {
        attributeClass: stateAttrs.PresetSelectionStateAttribute.name,
        attributeType: stateAttrs.PresetSelectionStateAttribute.TYPE.MOVEMENT_MODE
    },
    [capabilities.WaterUsageControlCapability.TYPE]: {
        attributeClass: stateAttrs.PresetSelectionStateAttribute.name,
        attributeType: stateAttrs.PresetSelectionStateAttribute.TYPE.WATER_GRADE
    },
};

module.exports = PresetSelectionCapabilityMqttHandle;
