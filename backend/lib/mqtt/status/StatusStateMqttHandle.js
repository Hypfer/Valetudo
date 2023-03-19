const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const RobotStateNodeMqttHandle = require("../handles/RobotStateNodeMqttHandle");
const stateAttrs = require("../../entities/state/attributes");
const ValetudoRobotError = require("../../entities/core/ValetudoRobotError");

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

                await this.controller.hassAnchorProvider.getAnchor(
                    HassAnchor.ANCHOR.VACUUM_STATE
                ).post(HA_STATE_MAPPINGS[statusState.value]);

                return statusState.value;
            }
        }));

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "flag",
            friendlyName: "Status flag",
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
            topicName: "error_description",
            friendlyName: "Error description",
            datatype: DataType.STRING,
            getter: async () => {
                const statusState = this.robot.state.getFirstMatchingAttribute(this.getInterestingStatusAttributes()[0]);

                if (statusState === null) {
                    return "Unknown";
                } else if (statusState.value !== stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                    return "No error";
                } else {
                    return statusState.error?.message ?? "Unknown error";
                }
            },
        }).also((prop) => {
            this.controller.hassAnchorProvider.getTopicReference(
                HassAnchor.REFERENCE.ERROR_STATE_DESCRIPTION
            ).post(prop.getBaseTopic()).catch(err => {
                Logger.error("Error while posting value to HassAnchor", err);
            });
        }));

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "error",
                friendlyName: "Robot Error",
                datatype: DataType.STRING,
                format: "json",
                getter: async () => {
                    const statusState = this.robot.state.getFirstMatchingAttribute(this.getInterestingStatusAttributes()[0]);
                    let value;

                    if (statusState?.value === stateAttrs.StatusStateAttribute.VALUE.ERROR) {
                        value = statusState.error;
                    } else {
                        value = new ValetudoRobotError({
                            severity: {
                                kind: ValetudoRobotError.SEVERITY_KIND.NONE,
                                level: ValetudoRobotError.SEVERITY_LEVEL.NONE
                            },
                            subsystem: ValetudoRobotError.SUBSYSTEM.NONE,
                            message: "",
                            vendorErrorCode: "",
                        });
                    }

                    return {
                        severity: value.severity,
                        subsystem: value.subsystem,
                        message: value.message
                    };
                },
                helpText: "This property contains the current ValetudoRobotError (if any)"
            }).also((prop) => {
                this.controller.hassAnchorProvider.getTopicReference(
                    HassAnchor.REFERENCE.VALETUDO_ROBOT_ERROR
                ).post(prop.getBaseTopic()).catch(err => {
                    Logger.error("Error while posting value to HassAnchor", err);
                });
            })
        );

        this.controller.withHass((hass => {
            this.attachHomeAssistantComponent(
                new InLineHassComponent({
                    hass: hass,
                    robot: this.robot,
                    name: "error",
                    friendlyName: "Error",
                    componentType: ComponentType.SENSOR,
                    autoconf: {
                        state_topic: this.controller.hassAnchorProvider.getTopicReference(
                            HassAnchor.REFERENCE.ERROR_STATE_DESCRIPTION
                        ),
                        icon: "mdi:alert",
                        entity_category: EntityCategory.DIAGNOSTIC,
                        json_attributes_topic: this.controller.hassAnchorProvider.getTopicReference(
                            HassAnchor.REFERENCE.VALETUDO_ROBOT_ERROR
                        )
                    }
                })
            );
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
