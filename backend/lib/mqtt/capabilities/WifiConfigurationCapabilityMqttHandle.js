const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const DeviceClass = require("../homeassistant/DeviceClass");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const StateClass = require("../homeassistant/StateClass");
const Unit = require("../common/Unit");

class WifiConfigurationCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/WifiConfigurationCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Wi-Fi configuration"
        }));
        this.capability = options.capability;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "ssid",
                friendlyName: "Wireless network",
                datatype: DataType.STRING,
                getter: async () => {
                    return this.controller.hassAnchorProvider.getAnchor(HassAnchor.ANCHOR.WIFI_SSID).getValue();
                }
            })
        );

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "ips",
                friendlyName: "IP addresses",
                datatype: DataType.STRING,
                getter: async () => {
                    return this.controller.hassAnchorProvider.getAnchor(HassAnchor.ANCHOR.WIFI_IPS).getValue()?.join(",");
                }
            })
        );

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "frequency",
                friendlyName: "Frequency",
                datatype: DataType.STRING,
                getter: async () => {
                    return this.controller.hassAnchorProvider.getAnchor(HassAnchor.ANCHOR.WIFI_FREQUENCY).getValue();
                }
            })
        );

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "signal",
                friendlyName: "Signal",
                datatype: DataType.INTEGER,
                unit: Unit.DECIBEL_MILLIWATT,
                getter: async () => {
                    return this.controller.hassAnchorProvider.getAnchor(HassAnchor.ANCHOR.WIFI_SIGNAL).getValue();
                }
            })
        );

        this.controller.withHass((hass) => {
            this.attachHomeAssistantComponent(
                new InLineHassComponent({
                    hass: hass,
                    robot: this.robot,
                    name: this.capability.getType(),
                    friendlyName: "Wi-Fi configuration",
                    componentType: ComponentType.SENSOR,
                    baseTopicReference: this.controller.hassAnchorProvider.getTopicReference(
                        HassAnchor.REFERENCE.HASS_WIFI_CONFIG_ATTRS
                    ),
                    autoconf: {
                        state_topic: this.controller.hassAnchorProvider.getTopicReference(
                            HassAnchor.REFERENCE.HASS_WIFI_CONFIG_ATTRS
                        ),
                        value_template: "{{ value_json.state }}",
                        unit_of_measurement: "dBm",
                        icon: "mdi:wifi",
                        json_attributes_topic: this.controller.hassAnchorProvider.getTopicReference(
                            HassAnchor.REFERENCE.HASS_WIFI_CONFIG_ATTRS
                        ),
                        json_attributes_template: "{{ value_json.attributes | to_json }}",
                        entity_category: EntityCategory.DIAGNOSTIC,
                        device_class: DeviceClass.SIGNAL_STRENGTH,
                        state_class: StateClass.MEASUREMENT
                    },
                    topics: {
                        "": {
                            state: this.controller.hassAnchorProvider.getAnchor(
                                HassAnchor.ANCHOR.WIFI_SIGNAL
                            ),
                            attributes: {
                                ssid: this.controller.hassAnchorProvider.getAnchor(
                                    HassAnchor.ANCHOR.WIFI_SSID
                                ),
                                ips: this.controller.hassAnchorProvider.getAnchor(
                                    HassAnchor.ANCHOR.WIFI_IPS
                                ),
                                frequency: this.controller.hassAnchorProvider.getAnchor(
                                    HassAnchor.ANCHOR.WIFI_FREQUENCY
                                ),
                                signal: this.controller.hassAnchorProvider.getAnchor(
                                    HassAnchor.ANCHOR.WIFI_SIGNAL
                                )
                            }
                        }
                    }
                })
            );
        });
    }

    async refresh() {
        const wifiCfg = await this.capability.getWifiStatus();
        await this.controller.hassAnchorProvider.getAnchor(HassAnchor.ANCHOR.WIFI_SSID).post(wifiCfg.details.ssid ?? "");
        await this.controller.hassAnchorProvider.getAnchor(HassAnchor.ANCHOR.WIFI_IPS).post(wifiCfg.details.ips ?? []);
        await this.controller.hassAnchorProvider.getAnchor(HassAnchor.ANCHOR.WIFI_FREQUENCY).post(wifiCfg.details.frequency ?? "");
        await this.controller.hassAnchorProvider.getAnchor(HassAnchor.ANCHOR.WIFI_SIGNAL).post(wifiCfg.details.signal ?? 0);

        await super.refresh();
    }
}

WifiConfigurationCapabilityMqttHandle.OPTIONAL = false;

module.exports = WifiConfigurationCapabilityMqttHandle;
