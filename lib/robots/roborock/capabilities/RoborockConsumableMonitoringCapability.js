const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");

const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");

class RoborockConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Array<import("../../../entities/state/attributes/ConsumableStateAttribute")>}
     */
    async getConsumables() {
        const data = await this.robot.sendCommand("get_consumable", [], {});

        const consumables = [
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, 300*60 - (data[0].main_brush_work_time / 60))), //Converted to minutes
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                },
                metaData: {
                    roborockConsumableType: "main_brush_work_time"
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                remaining: {
                    value: Math.round(Math.max(0, 200*60 - (data[0].side_brush_work_time / 60))), //Converted to minutes
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                },
                metaData: {
                    roborockConsumableType: "side_brush_work_time"
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.FILTER,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, 150*60 - (data[0].filter_work_time / 60))), //Converted to minutes
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                },
                metaData: {
                    roborockConsumableType: "filter_work_time"
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.SENSOR,
                subType: ConsumableStateAttribute.SUB_TYPE.ALL,
                remaining: {
                    value: Math.round(Math.max(0, 30*60 - (data[0].sensor_dirty_time / 60))), //Converted to minutes
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                },
                metaData: {
                    roborockConsumableType: "sensor_dirty_time"
                }
            }),
        ];

        consumables.forEach(c => this.robot.state.upsertFirstMatchingAttribute(c));

        return consumables;
    }

    /**
     * @abstract
     * @param type
     * @param [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        const consumable = this.robot.state.getFirstMatchingAttribute({
            attributeClass: ConsumableStateAttribute.name,
            attributeType: type,
            attributeSubType: subType
        });

        if (consumable) {
            await this.robot.sendCommand("reset_consumable", [consumable.metaData.roborockConsumableType], {});
        } else {
            throw new Error("No such consumable");
        }
    }
}

module.exports = RoborockConsumableMonitoringCapability;