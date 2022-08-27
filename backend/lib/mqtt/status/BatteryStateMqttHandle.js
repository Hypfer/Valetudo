const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
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

                HassAnchor.getAnchor(HassAnchor.ANCHOR.BATTERY_LEVEL).post(batteryState.level).catch(err => {
                    Logger.error("Error while posting value to HassAnchor", err);
                });

                return batteryState.level;
            }
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

                await HassAnchor.getAnchor(HassAnchor.ANCHOR.BATTERY_CHARGING).post(batteryState.flag === stateAttrs.BatteryStateAttribute.FLAG.CHARGING);

                return batteryState.flag;
            }
        }));
    }

    getInterestingStatusAttributes() {
        return [{attributeClass: stateAttrs.BatteryStateAttribute.name}];
    }
}

module.exports = BatteryStateMqttHandle;
