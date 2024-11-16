const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const capabilities = require("../../core/capabilities");
const Commands = require("../common/Commands");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class SimpleToggleCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/SimpleToggleCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[options.capability.getType()]
        }));
        this.capability = options.capability;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "enabled",
                friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[options.capability.getType()],
                datatype: DataType.ENUM,
                format: Object.values(Commands.SWITCH).join(","),
                setter: async (value) => {
                    if (value === Commands.SWITCH.ON) {
                        await this.capability.enable();
                    } else if (value === Commands.SWITCH.OFF) {
                        await this.capability.disable();
                    } else {
                        throw new Error("Invalid value");
                    }
                },
                getter: async () => {
                    const isEnabled = await this.capability.isEnabled();

                    if (isEnabled) {
                        return Commands.SWITCH.ON;
                    } else {
                        return Commands.SWITCH.OFF;
                    }
                },
            }).also((prop) => {
                const capabilityType = options.capability.getType();

                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: capabilityType,
                            friendlyName: CAPABILITIES_TO_FRIENDLY_NAME_MAPPING[capabilityType],
                            componentType: ComponentType.SWITCH,
                            autoconf: {
                                state_topic: prop.getBaseTopic(),
                                value_template: "{{ value }}",
                                command_topic: prop.getBaseTopic() + "/set",
                                icon: CAPABILITIES_TO_ICON_MAPPING[capabilityType],
                                entity_category: EntityCategory.CONFIG,
                            }
                        })
                    );
                });
            })
        );
    }

}

const CAPABILITIES_TO_FRIENDLY_NAME_MAPPING = {
    [capabilities.KeyLockCapability.TYPE]: "Lock Keys",
    [capabilities.ObstacleAvoidanceControlCapability.TYPE]: "Obstacle Avoidance",
    [capabilities.PetObstacleAvoidanceControlCapability.TYPE]: "Pet Obstacle Avoidance",
    [capabilities.CarpetModeControlCapability.TYPE]: "Carpet Mode",
};

const CAPABILITIES_TO_ICON_MAPPING = {
    [capabilities.KeyLockCapability.TYPE]: "mdi:lock",
    [capabilities.ObstacleAvoidanceControlCapability.TYPE]: "mdi:cable-data",
    [capabilities.PetObstacleAvoidanceControlCapability.TYPE]: "mdi:paw",
    [capabilities.CarpetModeControlCapability.TYPE]: "mdi:access-point",
};

module.exports = SimpleToggleCapabilityMqttHandle;
