const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const RobotStateNodeMqttHandle = require("../handles/RobotStateNodeMqttHandle");
const stateAttrs = require("../../entities/state/attributes");
const Unit = require("../common/Unit");

class BatteryStateMqttHandle extends RobotStateNodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: "BatteryStateAttribute",
            friendlyName: "Battery state",
            type: "Status"
        }));

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "level",
            friendlyName: "Battery level",
            datatype: DataType.INTEGER,
            unit: Unit.PERCENT,
            getter: async () => {
                const batteryState = this.robot.state.getFirstMatchingAttribute(this.getInterestingStatusAttributes()[0]);
                if (batteryState === null) {
                    return null;
                }

                this.controller.hassAnchorProvider.getAnchor(
                    HassAnchor.ANCHOR.BATTERY_LEVEL
                ).post(batteryState.level).catch(err => {
                    Logger.error("Error while posting value to HassAnchor", err);
                });

                return batteryState.level;
            }
        }).also((prop) => {
            this.controller.withHass((hass => {
                prop.attachHomeAssistantComponent(
                    new InLineHassComponent({
                        hass: hass,
                        robot: this.robot,
                        name: "battery_level",
                        friendlyName: "Battery level",
                        componentType: ComponentType.SENSOR,
                        autoconf: {
                            state_topic: prop.getBaseTopic(),
                            icon: "mdi:battery",
                            entity_category: EntityCategory.DIAGNOSTIC,
                            unit_of_measurement: Unit.PERCENT
                        }
                    })
                );
            }));
        }));

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "status",
            friendlyName: "Battery status",
            datatype: DataType.ENUM,
            format: Object.values(stateAttrs.BatteryStateAttribute.FLAG).join(","),
            getter: async () => {
                const batteryState = this.robot.state.getFirstMatchingAttribute(this.getInterestingStatusAttributes()[0]);
                if (batteryState === null) {
                    return null;
                }

                await this.controller.hassAnchorProvider.getAnchor(
                    HassAnchor.ANCHOR.BATTERY_CHARGING
                ).post(batteryState.flag === stateAttrs.BatteryStateAttribute.FLAG.CHARGING);

                return batteryState.flag;
            }
        }));
    }

    getInterestingStatusAttributes() {
        return [{attributeClass: stateAttrs.BatteryStateAttribute.name}];
    }
}

module.exports = BatteryStateMqttHandle;
