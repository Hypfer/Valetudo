const RobotStateNodeMqttHandle = require("../handles/RobotStateNodeMqttHandle");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const DataType = require("../homie/DataType");
const stateAttrs = require("../../entities/state/attributes");
const HassAnchor = require("../homeassistant/HassAnchor");

class StatusStateMqttHandle extends RobotStateNodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: "StatusStateAttribute",
            friendlyName: "Vacuum status",
            type: "Status"
        }));

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "status",
            friendlyName: "Status",
            datatype: DataType.ENUM,
            format: Object.values(stateAttrs.StatusStateAttribute.VALUE).join(","),
            getter: async () => {
                const statusState = this.robot.state.getFirstMatchingAttribute(this.getInterestingStatusAttributes()[0]);
                if (statusState === null) {
                    return null;
                }
                await HassAnchor.getAnchor(HassAnchor.ANCHOR.IS_CLEANING)
                    .post(statusState.value === stateAttrs.StatusStateAttribute.VALUE.CLEANING);
                await HassAnchor.getAnchor(HassAnchor.ANCHOR.IS_DOCKED)
                    .post(statusState.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED);
                return statusState.value;
            }
        }));

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "detail",
            friendlyName: "Status detail",
            datatype: DataType.ENUM,
            format: Object.values(stateAttrs.StatusStateAttribute.FLAG).join(","),
            getter: async () => {
                const statusState = this.robot.state.getFirstMatchingAttribute(this.getInterestingStatusAttributes()[0]);
                if (statusState === null) {
                    return null;
                }
                return statusState.flag;
            }
        }));
    }

    getInterestingStatusAttributes() {
        return [{attributeClass: stateAttrs.StatusStateAttribute.name}];
    }
}

module.exports = StatusStateMqttHandle;