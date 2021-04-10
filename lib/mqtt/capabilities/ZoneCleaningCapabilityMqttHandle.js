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
                }
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
                    const ids = JSON.parse(value);
                    if (!Array.isArray(ids)) {
                        throw Error("Start zone cleaning payload must be a JSON array of zone IDs to clean");
                    }
                    if (ids.length === 0) {
                        throw Error("Start zone cleaning payload is an empty array");
                    }
                    const loadedZones = ids.map(id => this.robot.config.get("zonePresets")[id]);
                    if (loadedZones.includes(undefined)) {
                        throw new Error("Invalid zone IDs found in start payload");
                    }
                    await this.capability.start(loadedZones);
                }
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

