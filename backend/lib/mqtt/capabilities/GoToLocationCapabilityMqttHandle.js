const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class GoToLocationCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/GoToLocationCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Go to location"
        }));
        this.capability = options.capability;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "presets",
                friendlyName: "Presets",
                datatype: DataType.STRING,
                format: "json",
                getter: async () => {
                    const result = this.robot.config.get("goToLocationPresets") ?? {};
                    await HassAnchor.getAnchor(HassAnchor.ANCHOR.GOTO_PRESETS_LEN).post(Object.keys(result).length);
                    return result;
                },
                helpText: "This handle provides a set of configured Go-to-location presets as a JSON object."
            }).also((prop) => {
                HassAnchor.getTopicReference(HassAnchor.REFERENCE.GOTO_PRESETS).post(prop.getBaseTopic()).then();
            })
        );

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "go",
                friendlyName: "Go to location preset",
                datatype: DataType.STRING,
                setter: async (value) => {
                    const gotoPreset = this.robot.config.get("goToLocationPresets")[value];
                    if (gotoPreset === undefined) {
                        throw new Error("Invalid go to location preset ID found in go payload");
                    }
                    await this.capability.goTo(gotoPreset);
                },
                helpText: "Use this handle to make the robot go to a configured preset location. It accepts one " +
                    "single preset UUID as a regular string."
            })
        );

        this.controller.withHass((hass) => {
            this.attachHomeAssistantComponent(
                new InLineHassComponent({
                    hass: hass,
                    robot: this.robot,
                    name: this.capability.getType(),
                    friendlyName: "GoTo Locations",
                    componentType: ComponentType.SENSOR,
                    baseTopicReference: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_GOTO_LOCATION_STATE),
                    autoconf: {
                        state_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HASS_GOTO_LOCATION_STATE),
                        icon: "mdi:map-marker-outline",
                        json_attributes_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.GOTO_PRESETS),
                        json_attributes_template: "{{ value }}"
                    },
                    topics: {
                        "": HassAnchor.getAnchor(HassAnchor.ANCHOR.GOTO_PRESETS_LEN)
                    }
                })
            );
        });
    }

}

module.exports = GoToLocationCapabilityMqttHandle;

