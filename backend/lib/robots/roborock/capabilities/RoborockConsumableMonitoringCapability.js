const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");

const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");

/**
 * @extends ConsumableMonitoringCapability<import("../RoborockValetudoRobot")>
 */
class RoborockConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     *
     * @param {object} options
     * @param {import("../RoborockValetudoRobot")} options.robot
     * @param {boolean} [options.hasUltraDock]
     */
    constructor(options) {
        super(options);

        this.hasUltraDock = options.hasUltraDock;
    }
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/state/attributes/ConsumableStateAttribute")>>}
     */
    async getConsumables() {
        const data = await this.robot.sendCommand("get_consumable", [], {});

        const consumables = [
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: CONVERT_TO_MINUTES_REMAINING(data[0].main_brush_work_time, 300),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                remaining: {
                    value: CONVERT_TO_MINUTES_REMAINING(data[0].side_brush_work_time, 200),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.FILTER,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: CONVERT_TO_MINUTES_REMAINING(data[0].filter_work_time, 150),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.SENSOR,
                subType: ConsumableStateAttribute.SUB_TYPE.ALL,
                remaining: {
                    value: CONVERT_TO_MINUTES_REMAINING(data[0].sensor_dirty_time, 30),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
        ];

        if (this.hasUltraDock) {
            consumables.push(
                new ConsumableStateAttribute({
                    type: ConsumableStateAttribute.TYPE.BRUSH,
                    subType: ConsumableStateAttribute.SUB_TYPE.DOCK,
                    remaining: {
                        value: CONVERT_TO_PERCENT_REMAINING(data[0].cleaning_brush_work_times, 300),
                        unit: ConsumableStateAttribute.UNITS.PERCENT
                    }
                }),
                new ConsumableStateAttribute({
                    type: ConsumableStateAttribute.TYPE.FILTER,
                    subType: ConsumableStateAttribute.SUB_TYPE.DOCK,
                    remaining: {
                        value: CONVERT_TO_PERCENT_REMAINING(data[0].strainer_work_times, 150),
                        unit: ConsumableStateAttribute.UNITS.PERCENT
                    }
                }),
                new ConsumableStateAttribute({
                    type: ConsumableStateAttribute.TYPE.BIN,
                    subType: ConsumableStateAttribute.SUB_TYPE.DOCK,
                    remaining: {
                        value: CONVERT_TO_PERCENT_REMAINING(data[0].dust_collection_work_times, 60),
                        unit: ConsumableStateAttribute.UNITS.PERCENT
                    }
                }),
            );
        }

        consumables.forEach(c => {
            return this.robot.state.upsertFirstMatchingAttribute(c);
        });

        this.robot.emitStateAttributesUpdated();

        return consumables;
    }

    /**
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        const consumable = this.robot.state.getFirstMatchingAttribute({
            attributeClass: ConsumableStateAttribute.name,
            attributeType: type,
            attributeSubType: subType
        });

        if (consumable) {
            await this.robot.sendCommand("reset_consumable", [CONSUMABLE_TYPE_MAP[consumable.type]?.[consumable.subType]], {});

            this.markEventsAsProcessed(type, subType);
        } else {
            throw new Error("No such consumable");
        }
    }

    getProperties() {
        const availableConsumables = [
            {
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                unit: ConsumableStateAttribute.UNITS.MINUTES,
                maxValue: 300 * 60
            },
            {
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                unit: ConsumableStateAttribute.UNITS.MINUTES,
                maxValue: 200 * 60
            },
            {
                type: ConsumableStateAttribute.TYPE.FILTER,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                unit: ConsumableStateAttribute.UNITS.MINUTES,
                maxValue: 150 * 60
            },
            {
                type: ConsumableStateAttribute.TYPE.SENSOR,
                subType: ConsumableStateAttribute.SUB_TYPE.ALL,
                unit: ConsumableStateAttribute.UNITS.MINUTES,
                maxValue: 30 * 60
            }
        ];

        if (this.hasUltraDock) {
            availableConsumables.push(
                {
                    type: ConsumableStateAttribute.TYPE.BRUSH,
                    subType: ConsumableStateAttribute.SUB_TYPE.DOCK,
                    unit: ConsumableStateAttribute.UNITS.PERCENT,
                    maxValue: 100
                },
                {
                    type: ConsumableStateAttribute.TYPE.FILTER,
                    subType: ConsumableStateAttribute.SUB_TYPE.DOCK,
                    unit: ConsumableStateAttribute.UNITS.PERCENT,
                    maxValue: 100
                },
                {
                    type: ConsumableStateAttribute.TYPE.BIN,
                    subType: ConsumableStateAttribute.SUB_TYPE.DOCK,
                    unit: ConsumableStateAttribute.UNITS.PERCENT,
                    maxValue: 100
                },
            );
        }

        return {
            availableConsumables: availableConsumables
        };
    }
}

function CONVERT_TO_MINUTES_REMAINING(value, total) {
    return Math.round(Math.max(0, total*60 - (value / 60)));
}

function CONVERT_TO_PERCENT_REMAINING(value, total) {
    return 100 - Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

const CONSUMABLE_TYPE_MAP = Object.freeze({
    [ConsumableStateAttribute.TYPE.BRUSH]: {
        [ConsumableStateAttribute.SUB_TYPE.MAIN]: "main_brush_work_time",
        [ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT]: "side_brush_work_time",
        [ConsumableStateAttribute.SUB_TYPE.DOCK]: "cleaning_brush_work_times"
    },
    [ConsumableStateAttribute.TYPE.FILTER]: {
        [ConsumableStateAttribute.SUB_TYPE.MAIN]: "filter_work_time",
        [ConsumableStateAttribute.SUB_TYPE.DOCK]: "strainer_work_times"
    },
    [ConsumableStateAttribute.TYPE.SENSOR]: {
        [ConsumableStateAttribute.SUB_TYPE.ALL]: "sensor_dirty_time"
    },
    [ConsumableStateAttribute.TYPE.BIN]: {
        [ConsumableStateAttribute.SUB_TYPE.DOCK]: "dust_collection_work_times"
    }
});

module.exports = RoborockConsumableMonitoringCapability;
