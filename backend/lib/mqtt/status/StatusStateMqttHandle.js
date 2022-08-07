const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
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

                await HassAnchor.getAnchor(HassAnchor.ANCHOR.VACUUM_STATE).post(HA_STATE_MAPPINGS[statusState.value]);

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

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "error",
            friendlyName: "Error description",
            datatype: DataType.STRING,
            getter: async () => {
                const statusState = this.robot.state.getFirstMatchingAttribute(this.getInterestingStatusAttributes()[0]);

                if (statusState === null) {
                    return null;
                } else if (statusState.value !== stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                    return "";  // Clear error
                } else {
                    return statusState.error?.message ?? null;
                }
            },
            helpText: "The error description will only be populated when the robot reports an error. Errors in " +
                "Valetudo not reported by the robot won't be sent here."
        }).also((prop) => {
            this.controller.withHass((hass => {
                prop.attachHomeAssistantComponent(
                    new InLineHassComponent({
                        hass: hass,
                        robot: this.robot,
                        name: "error",
                        friendlyName: "Error description",
                        componentType: ComponentType.SENSOR,
                        autoconf: {
                            state_topic: prop.getBaseTopic(),
                            icon: "mdi:alert",
                            entity_category: EntityCategory.DIAGNOSTIC
                        }
                    })
                );
            }));
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
