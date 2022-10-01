const CapabilityMqttHandle = require("./CapabilityMqttHandle");

const capabilities = require("../../core/capabilities");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class SpeakerVolumeControlCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/SpeakerVolumeControlCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Speaker volume control"
        }));
        this.capability = options.capability;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "value",
                friendlyName: "Speaker volume",
                datatype: DataType.INTEGER,
                format: "0:100",
                setter: async (value) => {
                    if (Number.isInteger(value) && value >= 0 && value <= 100) {
                        await this.capability.setVolume(value);
                    } else {
                        throw new Error("Invalid speaker volume");
                    }
                },
                getter: async () => {
                    return HassAnchor.getAnchor(HassAnchor.ANCHOR.SPEAKER_VOLUME).getValue();
                },
                helpText: "This handle returns the current speaker volume"
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: capabilities.SpeakerVolumeControlCapability.TYPE,
                            friendlyName: "Speaker volume",
                            componentType: ComponentType.NUMBER,
                            autoconf: {
                                state_topic: prop.getBaseTopic(),
                                command_topic: prop.getBaseTopic() + "/set",
                                icon: "mdi:volume-source",
                                entity_category: EntityCategory.CONFIG,
                            }
                        })
                    );
                });
            })
        );
    }

    async refresh() {
        const currentVolume = await this.capability.getVolume();
        await HassAnchor.getAnchor(HassAnchor.ANCHOR.SPEAKER_VOLUME).post(currentVolume);

        await super.refresh();
    }
}

SpeakerVolumeControlCapabilityMqttHandle.OPTIONAL = true;

module.exports = SpeakerVolumeControlCapabilityMqttHandle;
