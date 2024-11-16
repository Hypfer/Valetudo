const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const capabilities = require("../../core/capabilities");
const Commands = require("../common/Commands");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const stateAttrs = require("../../entities/state/attributes");

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
                friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[this.capability.getType()],
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
                        await this.controller.hassAnchorProvider.getAnchor(
                            HassAnchor.ANCHOR.FAN_SPEED
                        ).post(attr.value);
                    }

                    return attr.value;
                },
                helpText: "This handle allows setting the " +
                    CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[this.capability.getType()].toLowerCase() + ". " +
                    "It accepts the preset payloads specified in `$format` or in the HAss json attributes.",
                helpMayChange: {
                    "Enum payloads": "Different robot models have different " +
                        CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[this.capability.getType()].toLowerCase() +
                        " presets. Always check `$format`/`json_attributes` during startup."
                }
            }).also((prop) => {
                const capabilityType = this.capability.getType();

                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: capabilityType,
                            friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[capabilityType],
                            componentType: ComponentType.SELECT,
                            autoconf: {
                                state_topic: prop.getBaseTopic(),
                                value_template: "{{ value }}",
                                command_topic: prop.getBaseTopic() + "/set",
                                options: this.capability.getPresets(),
                                icon: CAPABILITIES_TO_ICON_MAPPING[capabilityType],
                                entity_category: EntityCategory.CONFIG,
                            }
                        })
                    );
                });


                if (capabilityType === capabilities.FanSpeedControlCapability.TYPE) {
                    /*
                        Current versions of home assistant feature the fan speed as a drop-down that is part
                        of the vacuum entity. This is because the vacuum entity was designed based on the xiaomi
                        mi robot vacuum and thus can do everything that robot could do.
                        
                        However, as time moved on, robots gained more capabilities, which makes this a bit odd as
                        we basically expose the same control twice
                     */

                    // Sent as a topic reference since this is used for the autoconfig of the vacuum entity
                    this.controller.hassAnchorProvider.getTopicReference(
                        HassAnchor.REFERENCE.FAN_SPEED_PRESETS
                    ).post(this.capability.getPresets()).catch(err => {
                        Logger.error("Error while posting value to HassAnchor", err);
                    });

                    this.controller.hassAnchorProvider.getTopicReference(
                        HassAnchor.REFERENCE.FAN_SPEED_SET
                    ).post(prop.getBaseTopic() + "/set").catch(err => {
                        Logger.error("Error while posting value to HassAnchor", err);
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
    [capabilities.FanSpeedControlCapability.TYPE]: "Fan",
    [capabilities.WaterUsageControlCapability.TYPE]: "Water",
    [capabilities.OperationModeControlCapability.TYPE]: "Mode",
};

const CAPABILITIES_TO_STATE_ATTR_MAPPING = {
    [capabilities.FanSpeedControlCapability.TYPE]: {
        attributeClass: stateAttrs.PresetSelectionStateAttribute.name,
        attributeType: stateAttrs.PresetSelectionStateAttribute.TYPE.FAN_SPEED
    },
    [capabilities.WaterUsageControlCapability.TYPE]: {
        attributeClass: stateAttrs.PresetSelectionStateAttribute.name,
        attributeType: stateAttrs.PresetSelectionStateAttribute.TYPE.WATER_GRADE
    },
    [capabilities.OperationModeControlCapability.TYPE]: {
        attributeClass: stateAttrs.PresetSelectionStateAttribute.name,
        attributeType: stateAttrs.PresetSelectionStateAttribute.TYPE.OPERATION_MODE
    },
};

const CAPABILITIES_TO_ICON_MAPPING = {
    [capabilities.FanSpeedControlCapability.TYPE]: "mdi:fan",
    [capabilities.WaterUsageControlCapability.TYPE]: "mdi:water-pump",
    [capabilities.OperationModeControlCapability.TYPE]: "mdi:developer-board",
};

module.exports = PresetSelectionCapabilityMqttHandle;
