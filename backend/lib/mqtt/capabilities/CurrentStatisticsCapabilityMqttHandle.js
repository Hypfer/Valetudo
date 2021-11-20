const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const Commands = require("../common/Commands");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const PropertyMqttHandle = require("../handles/PropertyMqttHandle");
const Unit = require("../common/Unit");
const ValetudoDataPoint = require("../../entities/core/ValetudoDataPoint");

class CurrentStatisticsCapabilityMqttHandle extends CapabilityMqttHandle {
    /**
     * @param {object} options
     * @param {import("../handles/RobotMqttHandle")} options.parent
     * @param {import("../MqttController")} options.controller MqttController instance
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {import("../../core/capabilities/CurrentStatisticsCapability")} options.capability
     */
    constructor(options) {
        super(Object.assign(options, {
            friendlyName: "Current Statistics"
        }));
        this.capability = options.capability;

        this.registerChild(
            new PropertyMqttHandle({
                parent: this,
                controller: this.controller,
                topicName: "refresh",
                friendlyName: "Refresh current statistics",
                datatype: DataType.ENUM,
                format: Commands.BASIC.PERFORM,
                setter: async (value) => {
                    await this.refresh();
                }
            })
        );

        this.capability.getProperties().availableStatistics.forEach(availableStatistic => {
            switch (availableStatistic) {
                case ValetudoDataPoint.TYPES.TIME:
                    this.registerChild(
                        new PropertyMqttHandle({
                            parent: this,
                            controller: this.controller,
                            topicName: "time",
                            friendlyName: "Current Statistics Time",
                            datatype: DataType.INTEGER,
                            getter: async () => {
                                return HassAnchor.getAnchor(HassAnchor.ANCHOR.CURRENT_STATISTICS_TIME).getValue();
                            },
                            helpText: "This handle returns the current statistics time in seconds"
                        }).also((prop) => {
                            this.controller.withHass((hass => {
                                prop.attachHomeAssistantComponent(
                                    new InLineHassComponent({
                                        hass: hass,
                                        robot: this.robot,
                                        name: this.capability.getType() + "_time",
                                        friendlyName: "Current Statistics Time",
                                        componentType: ComponentType.SENSOR,
                                        autoconf: {
                                            state_topic: prop.getBaseTopic(),
                                            icon: "mdi:equalizer",
                                            entity_category: EntityCategory.DIAGNOSTIC
                                        }
                                    })
                                );
                            }));
                        })
                    );
                    break;

                case ValetudoDataPoint.TYPES.AREA:
                    this.registerChild(
                        new PropertyMqttHandle({
                            parent: this,
                            controller: this.controller,
                            topicName: "area",
                            friendlyName: "Current Statistics Area",
                            datatype: DataType.INTEGER,
                            unit: Unit.SQUARE_CENTIMETER,
                            getter: async () => {
                                return HassAnchor.getAnchor(HassAnchor.ANCHOR.CURRENT_STATISTICS_AREA).getValue();
                            }
                        }).also((prop) => {
                            this.controller.withHass((hass => {
                                prop.attachHomeAssistantComponent(
                                    new InLineHassComponent({
                                        hass: hass,
                                        robot: this.robot,
                                        name: this.capability.getType() + "_area",
                                        friendlyName: "Current Statistics Area",
                                        componentType: ComponentType.SENSOR,
                                        autoconf: {
                                            state_topic: prop.getBaseTopic(),
                                            icon: "mdi:equalizer",
                                            entity_category: EntityCategory.DIAGNOSTIC
                                        }
                                    })
                                );
                            }));
                        })
                    );
                    break;
            }
        });
    }

    async refresh() {
        const currentStatistics = await this.capability.getStatistics();

        for (const point of currentStatistics) {
            switch (point.type) {
                case ValetudoDataPoint.TYPES.TIME:
                    await HassAnchor.getAnchor(HassAnchor.ANCHOR.CURRENT_STATISTICS_TIME).post(point.value);
                    break;
                case ValetudoDataPoint.TYPES.AREA:
                    await HassAnchor.getAnchor(HassAnchor.ANCHOR.CURRENT_STATISTICS_AREA).post(point.value);
                    break;
            }
        }

        await super.refresh();
    }
}

module.exports = CurrentStatisticsCapabilityMqttHandle;
