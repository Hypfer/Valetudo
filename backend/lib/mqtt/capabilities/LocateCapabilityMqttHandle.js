const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const Command = require("../common/Commands");
const Commands = require("../common/Commands");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class LocateCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/LocateCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Locate"
        }));
        this.capability = options.capability;

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "locate",
            friendlyName: "Locate",
            datatype: DataType.ENUM,
            format: Command.BASIC.PERFORM,
            setter: async (value) => {
                await this.capability.locate();
            }
        }).also((prop) => {
            this.controller.withHass((hass) => {
                prop.attachHomeAssistantComponent(
                    new InLineHassComponent({
                        hass: hass,
                        robot: this.robot,
                        name: this.capability.getType(),
                        friendlyName: "Play locate sound",
                        componentType: ComponentType.BUTTON,
                        autoconf: {
                            command_topic: `${prop.getBaseTopic()}/set`,
                            payload_press: Commands.BASIC.PERFORM,
                            icon: "mdi:map-marker-question",
                            enabled_by_default: false,
                            entity_category: EntityCategory.DIAGNOSTIC
                        }
                    })
                );
            });
        }));
    }
}

LocateCapabilityMqttHandle.OPTIONAL = false;

module.exports = LocateCapabilityMqttHandle;
