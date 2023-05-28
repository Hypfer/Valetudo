const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const Command = require("../common/Commands");
const Commands = require("../common/Commands");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class AutoEmptyDockManualTriggerCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/AutoEmptyDockManualTriggerCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Auto Empty Dock Manual Trigger"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "trigger",
            friendlyName: "Auto Empty Dock Manual Trigger",
            datatype: DataType.ENUM,
            format: Command.BASIC.PERFORM,
            setter: async (value) => {
                await this.capability.triggerAutoEmpty();
            }
        }).also((prop) => {
            this.controller.withHass((hass) => {
                prop.attachHomeAssistantComponent(
                    new InLineHassComponent({
                        hass: hass,
                        robot: this.robot,
                        name: this.capability.getType(),
                        friendlyName: "Trigger Auto Empty Dock",
                        componentType: ComponentType.BUTTON,
                        autoconf: {
                            command_topic: `${prop.getBaseTopic()}/set`,
                            payload_press: Commands.BASIC.PERFORM,
                            icon: "mdi:delete-restore"
                        }
                    })
                );
            });
        }));
    }
}

AutoEmptyDockManualTriggerCapabilityMqttHandle.OPTIONAL = false;

module.exports = AutoEmptyDockManualTriggerCapabilityMqttHandle;
