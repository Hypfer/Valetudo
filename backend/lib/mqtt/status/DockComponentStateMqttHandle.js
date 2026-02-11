const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const RobotStateNodeMqttHandle = require("../handles/RobotStateNodeMqttHandle");
const stateAttrs = require("../../entities/state/attributes");

class DockComponentStateMqttHandle extends RobotStateNodeMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     */
    constructor(options) {
        super(Object.assign(options, {
            topicName: "DockComponentStateAttribute",
            friendlyName: "Dock Component state",
            type: "Status"
        }));

        for (const dockComponent of options.robot.getModelDetails().supportedDockComponents) {
            this.registerChild(new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: dockComponent,
                friendlyName: DOCK_COMPONENT_FRIENDLY_NAME[dockComponent] ?? "Unknown",
                datatype: DataType.ENUM,
                format: Object.values(stateAttrs.DockComponentStateAttribute.VALUE).join(","),
                getter: async () => {
                    const attr = this.robot.state.getFirstMatchingAttribute({
                        attributeClass: stateAttrs.DockComponentStateAttribute.name,
                        attributeType: dockComponent
                    });
                    return attr?.value ?? stateAttrs.DockComponentStateAttribute.VALUE.UNKNOWN;
                },
                helpText: `This handle reports the state of the ${DOCK_COMPONENT_FRIENDLY_NAME[dockComponent].toLowerCase()} Dock Component.`
            }).also((prop) => {
                this.controller.withHass((hass) => {
                    prop.attachHomeAssistantComponent(
                        new InLineHassComponent({
                            hass: hass,
                            robot: this.robot,
                            name: `${dockComponent}_dock_component`,
                            friendlyName: `${DOCK_COMPONENT_FRIENDLY_NAME[dockComponent]} Dock Component`,
                            componentType: ComponentType.SENSOR,
                            autoconf: {
                                state_topic: prop.getBaseTopic(),
                                icon: DOCK_COMPONENT_ICON[dockComponent],
                                entity_category: EntityCategory.DIAGNOSTIC
                            }
                        })
                    );
                });
            }));
        }
    }

    getInterestingStatusAttributes() {
        return [{attributeClass: stateAttrs.DockComponentStateAttribute.name}];
    }
}

const DOCK_COMPONENT_FRIENDLY_NAME = Object.freeze({
    [stateAttrs.DockComponentStateAttribute.TYPE.WATER_TANK_CLEAN]: "Freshwater",
    [stateAttrs.DockComponentStateAttribute.TYPE.WATER_TANK_DIRTY]: "Wastewater",
    [stateAttrs.DockComponentStateAttribute.TYPE.DUSTBAG]: "Dustbag",
    [stateAttrs.DockComponentStateAttribute.TYPE.DETERGENT]: "Detergent"
});

const DOCK_COMPONENT_ICON = Object.freeze({
    [stateAttrs.DockComponentStateAttribute.TYPE.WATER_TANK_CLEAN]: "mdi:water",
    [stateAttrs.DockComponentStateAttribute.TYPE.WATER_TANK_DIRTY]: "mdi:water-off",
    [stateAttrs.DockComponentStateAttribute.TYPE.DUSTBAG]: "mdi:delete",
    [stateAttrs.DockComponentStateAttribute.TYPE.DETERGENT]: "mdi:bottle-tonic"
});

module.exports = DockComponentStateMqttHandle;
