const CapabilityMqttHandle = require("./CapabilityMqttHandle");
const ComponentType = require("../homeassistant/ComponentType");
const DataType = require("../homie/DataType");
const EntityCategory = require("../homeassistant/EntityCategory");
const HassAnchor = require("../homeassistant/HassAnchor");
const InLineHassComponent = require("../homeassistant/components/InLineHassComponent");
const Logger = require("../../Logger");
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
            friendlyName: "Current Statistics",
            helpMayChange: {
                "Properties": "Available statistics depend on the robot model.",
            }
        }));
        this.capability = options.capability;

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
                            unit: Unit.SECONDS,
                            getter: async () => {
                                return this.controller.hassAnchorProvider.getAnchor(
                                    HassAnchor.ANCHOR.CURRENT_STATISTICS_TIME
                                ).getValue();
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
                                            entity_category: EntityCategory.DIAGNOSTIC,
                                            unit_of_measurement: Unit.SECONDS
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
                                return this.controller.hassAnchorProvider.getAnchor(
                                    HassAnchor.ANCHOR.CURRENT_STATISTICS_AREA
                                ).getValue() / 100;
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
                                            entity_category: EntityCategory.DIAGNOSTIC,
                                            unit_of_measurement: Unit.SQUARE_CENTIMETER
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
        const totalStatistics = await this.capability.getStatistics();

        for (const point of totalStatistics) {
            const anchorId = DATA_POINT_TYPE_TO_ANCHOR_ID_MAPPING[point.type];

            if (anchorId) {
                await this.controller.hassAnchorProvider.getAnchor(anchorId).post(point.value);
            } else {
                Logger.warn(`No anchor found for CurrentStatistics DataPointType ${point.type}`);
            }
        }

        await super.refresh();
    }
}

const DATA_POINT_TYPE_TO_ANCHOR_ID_MAPPING = {
    [ValetudoDataPoint.TYPES.TIME]: HassAnchor.ANCHOR.CURRENT_STATISTICS_TIME,
    [ValetudoDataPoint.TYPES.AREA]: HassAnchor.ANCHOR.CURRENT_STATISTICS_AREA,
};

CurrentStatisticsCapabilityMqttHandle.OPTIONAL = true;

module.exports = CurrentStatisticsCapabilityMqttHandle;
