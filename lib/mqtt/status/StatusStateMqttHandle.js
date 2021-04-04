const DataType = require("../homie/DataType");
const HassAnchor = require("../homeassistant/HassAnchor");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const RobotStateNodeMqttHandle = require("../handles/RobotStateNodeMqttHandle");
const stateAttrs = require("../../entities/state/attributes");

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
                await HassAnchor.getAnchor(HassAnchor.ANCHOR.VACUUM_STATE)
                    .post(HA_STATE_MAPPINGS[statusState.value]);
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

const HA_STATES = {
    CLEANING: "cleaning",
    PAUSED: "paused",
    IDLE: "idle",
    RETURNING: "returning",
    DOCKED: "docked",
    ERROR: "error"
};

const HA_STATE_MAPPINGS = {
    [stateAttrs.StatusStateAttribute.VALUE.ERROR]: HA_STATES.ERROR,
    [stateAttrs.StatusStateAttribute.VALUE.DOCKED]: HA_STATES.DOCKED,
    [stateAttrs.StatusStateAttribute.VALUE.IDLE]: HA_STATES.IDLE,
    [stateAttrs.StatusStateAttribute.VALUE.RETURNING]: HA_STATES.RETURNING,
    [stateAttrs.StatusStateAttribute.VALUE.CLEANING]: HA_STATES.CLEANING,
    [stateAttrs.StatusStateAttribute.VALUE.PAUSED]: HA_STATES.PAUSED,
    [stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL]: HA_STATES.CLEANING,
    [stateAttrs.StatusStateAttribute.VALUE.MOVING]: HA_STATES.CLEANING
};

module.exports = StatusStateMqttHandle;
