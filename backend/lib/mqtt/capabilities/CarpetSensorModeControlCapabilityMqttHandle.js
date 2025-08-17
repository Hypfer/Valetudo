const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class CarpetSensorModeControlCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/CarpetSensorModeControlCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Carpet Sensor Mode"
        }));
        this.capability = options.capability;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "mode",
                friendlyName: "Carpet Sensor Mode",
                datatype: DataType.ENUM,
                format: this.capability.getProperties().supportedModes.join(","),
                setter: async (value) => {
                    await this.capability.setMode(value);
                },
                getter: async () => {
                    return this.capability.getMode();
                },
                helpText: "This handle allows setting the Carpet Sensor Mode. " +
                    "It accepts the preset payloads specified in `$format` or in the HAss json attributes.",
                helpMayChange: {
                    "Enum payloads": "Different robot models have different Carpet Sensor Modes. " +
                    "Always check `$format`/`json_attributes` during startup."
                }
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: this.capability.getType(),
                            friendlyName: "Carpet Sensor Mode",
                            componentType: ComponentType.SELECT,
                            autoconf: {
                                state_topic: prop.getBaseTopic(),
                                value_template: "{{ value }}",
                                command_topic: prop.getBaseTopic() + "/set",
                                options: this.capability.getProperties().supportedModes,
                                icon: "mdi:waves",
                                entity_category: EntityCategory.CONFIG,
                            }
                        })
                    );
                });
            })
        );
    }
}

CarpetSensorModeControlCapabilityMqttHandle.OPTIONAL = true;

module.exports = CarpetSensorModeControlCapabilityMqttHandle;
