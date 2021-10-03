const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");

class ZoneCleaningCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/ZoneCleaningCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Zone cleaning"
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
                    const result = this.robot.config.get("zonePresets") ?? {};
                    await HassAnchor.getAnchor(HassAnchor.ANCHOR.ZONE_PRESETS_LEN).post(Object.keys(result).length);
                    return result;
                },
                helpText: "This handles provides the list of configured zone presets as a JSON object."
            }).also((prop) => {
                HassAnchor.getTopicReference(HassAnchor.REFERENCE.ZONE_PRESETS).post(prop.getBaseTopic()).then();
            })
        );

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "start",
                friendlyName: "Start zone preset",
                datatype: DataType.STRING,
                format: "json",
                setter: async (value) => {
                    const loadedZone = this.robot.config.get("zonePresets")[value];
                    if (!loadedZone) {
                        throw new Error("Error while starting zone cleanup. There is no zone preset with id " + value);
                    }
                    try {
                        await this.capability.start(loadedZone.zones);
                    } catch (e) {
                        throw new Error(`Error while starting zone cleaning for zone_id ${value}: ${e}`);
                    }
                },
                helpText: "This handle accepts a zone preset **UUID** to start. You can retrieve them from the `/presets` handle.\n\n" +
                    "Sample value:\n" +
                    "`25f6b7fe-0a28-477d-a1af-937ad91b2df4`\n"
            })
        );

        this.controller.withHass((hass) => {
            this.attachHomeAssistantComponent(
                new InLineHassComponent({
                    hass: hass,
                    robot: this.robot,
                    name: this.capability.getType(),
                    friendlyName: "Zone Presets",
                    componentType: ComponentType.SENSOR,
                    baseTopicReference: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HAZZ_ZONE_CLEANING_STATE),
                    autoconf: {
                        state_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.HAZZ_ZONE_CLEANING_STATE),
                        icon: "mdi:square-outline",
                        json_attributes_topic: HassAnchor.getTopicReference(HassAnchor.REFERENCE.ZONE_PRESETS),
                        json_attributes_template: "{{ value }}"
                    },
                    topics: {
                        "": HassAnchor.getAnchor(HassAnchor.ANCHOR.ZONE_PRESETS_LEN)
                    }
                })
            );
        });
    }

}

module.exports = ZoneCleaningCapabilityMqttHandle;

