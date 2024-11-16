const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const RobotStateNodeMqttHandle = require("../handles/RobotStateNodeMqttHandle");
const stateAttrs = require("../../entities/state/attributes");

class DockStatusStateMqttHandle extends RobotStateNodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: "DockStatusStateAttribute",
            friendlyName: "Dock state",
            type: "Status"
        }));

        this.registerChild(new PropertyMqttHandle({
            parent: this,
            controller: this.controller,
            topicName: "status",
            friendlyName: "Status",
            datatype: DataType.ENUM,
            format: Object.values(stateAttrs.DockStatusStateAttribute.VALUE).join(","),
            getter: async () => {
                const dockStatus = this.robot.state.getFirstMatchingAttribute({
                    attributeClass: stateAttrs.DockStatusStateAttribute.name
                });

                if (dockStatus === null) {
                    return false;
                }

                return dockStatus.value;
            },
        }).also((prop) => {
            this.controller.withHass((hass => {
                prop.attachHomeAssistantComponent(
                    new InLineHassComponent({
                        hass: hass,
                        robot: this.robot,
                        name: "dock_status",
                        friendlyName: "Dock Status",
                        componentType: ComponentType.SENSOR,
                        autoconf: {
                            state_topic: prop.getBaseTopic(),
                            icon: "mdi:home",
                            entity_category: EntityCategory.DIAGNOSTIC
                        }
                    })
                );
            }));
        }));
    }

    getInterestingStatusAttributes() {
        return [{attributeClass: stateAttrs.DockStatusStateAttribute.name}];
    }
}

module.exports = DockStatusStateMqttHandle;
