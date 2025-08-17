const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");
const RoborockConst = require("../RoborockConst");
const ValetudoConsumable = require("../../../entities/core/ValetudoConsumable");

/**
 * @extends ConsumableMonitoringCapability<import("../RoborockValetudoRobot")>
 */
class RoborockConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     *
     * @param {object} options
     * @param {import("../RoborockValetudoRobot")} options.robot
     * @param {import("../RoborockConst").DOCK_TYPE} options.dockType
     */
    constructor(options) {
        super(options);

        this.dockType = options.dockType;
    }
    /**
     * This function polls the current consumables state
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/core/ValetudoConsumable")>>}
     */
    async getConsumables() {
        const data = await this.robot.sendCommand("get_consumable", [], {});

        const consumables = [
            new ValetudoConsumable({
                type: ValetudoConsumable.TYPE.BRUSH,
                subType: ValetudoConsumable.SUB_TYPE.MAIN,
                remaining: {
                    value: CONVERT_TO_MINUTES_REMAINING(data[0].main_brush_work_time, 300),
                    unit: ValetudoConsumable.UNITS.MINUTES
                }
            }),
            new ValetudoConsumable({
                type: ValetudoConsumable.TYPE.BRUSH,
                subType: ValetudoConsumable.SUB_TYPE.SIDE_RIGHT,
                remaining: {
                    value: CONVERT_TO_MINUTES_REMAINING(data[0].side_brush_work_time, 200),
                    unit: ValetudoConsumable.UNITS.MINUTES
                }
            }),
            new ValetudoConsumable({
                type: ValetudoConsumable.TYPE.FILTER,
                subType: ValetudoConsumable.SUB_TYPE.MAIN,
                remaining: {
                    value: CONVERT_TO_MINUTES_REMAINING(data[0].filter_work_time, 150),
                    unit: ValetudoConsumable.UNITS.MINUTES
                }
            }),
            new ValetudoConsumable({
                type: ValetudoConsumable.TYPE.CLEANING,
                subType: ValetudoConsumable.SUB_TYPE.SENSOR,
                remaining: {
                    value: CONVERT_TO_MINUTES_REMAINING(data[0].sensor_dirty_time, 30),
                    unit: ValetudoConsumable.UNITS.MINUTES
                }
            }),
        ];

        switch (this.dockType) {
            case RoborockConst.DOCK_TYPE.ULTRA:
                consumables.push(
                    new ValetudoConsumable({
                        type: ValetudoConsumable.TYPE.BRUSH,
                        subType: ValetudoConsumable.SUB_TYPE.DOCK,
                        remaining: {
                            value: CONVERT_TO_PERCENT_REMAINING(data[0].cleaning_brush_work_times, 300),
                            unit: ValetudoConsumable.UNITS.PERCENT
                        }
                    }),
                    new ValetudoConsumable({
                        type: ValetudoConsumable.TYPE.FILTER,
                        subType: ValetudoConsumable.SUB_TYPE.DOCK,
                        remaining: {
                            value: CONVERT_TO_PERCENT_REMAINING(data[0].strainer_work_times, 150),
                            unit: ValetudoConsumable.UNITS.PERCENT
                        }
                    }),
                    new ValetudoConsumable({
                        type: ValetudoConsumable.TYPE.BIN,
                        subType: ValetudoConsumable.SUB_TYPE.DOCK,
                        remaining: {
                            value: CONVERT_TO_PERCENT_REMAINING(data[0].dust_collection_work_times, 60),
                            unit: ValetudoConsumable.UNITS.PERCENT
                        }
                    }),
                );
                break;
            case RoborockConst.DOCK_TYPE.AUTO_EMPTY:
                consumables.push(
                    new ValetudoConsumable({
                        type: ValetudoConsumable.TYPE.BIN,
                        subType: ValetudoConsumable.SUB_TYPE.DOCK,
                        remaining: {
                            value: CONVERT_TO_PERCENT_REMAINING(data[0].dust_collection_work_times, 60),
                            unit: ValetudoConsumable.UNITS.PERCENT
                        }
                    }),
                );
                break;
        }

        this.raiseEventIfRequired(consumables);

        return consumables;
    }

    /**
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        const availableConsumables = this.getProperties().availableConsumables;
        const consumable = availableConsumables.find(c => c.type === type && c.subType === subType);

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
                type: ValetudoConsumable.TYPE.BRUSH,
                subType: ValetudoConsumable.SUB_TYPE.MAIN,
                unit: ValetudoConsumable.UNITS.MINUTES,
                maxValue: 300 * 60
            },
            {
                type: ValetudoConsumable.TYPE.BRUSH,
                subType: ValetudoConsumable.SUB_TYPE.SIDE_RIGHT,
                unit: ValetudoConsumable.UNITS.MINUTES,
                maxValue: 200 * 60
            },
            {
                type: ValetudoConsumable.TYPE.FILTER,
                subType: ValetudoConsumable.SUB_TYPE.MAIN,
                unit: ValetudoConsumable.UNITS.MINUTES,
                maxValue: 150 * 60
            },
            {
                type: ValetudoConsumable.TYPE.CLEANING,
                subType: ValetudoConsumable.SUB_TYPE.SENSOR,
                unit: ValetudoConsumable.UNITS.MINUTES,
                maxValue: 30 * 60
            }
        ];

        switch (this.dockType) {
            case RoborockConst.DOCK_TYPE.ULTRA:
                availableConsumables.push(
                    {
                        type: ValetudoConsumable.TYPE.BRUSH,
                        subType: ValetudoConsumable.SUB_TYPE.DOCK,
                        unit: ValetudoConsumable.UNITS.PERCENT,
                        maxValue: 100
                    },
                    {
                        type: ValetudoConsumable.TYPE.FILTER,
                        subType: ValetudoConsumable.SUB_TYPE.DOCK,
                        unit: ValetudoConsumable.UNITS.PERCENT,
                        maxValue: 100
                    },
                    {
                        type: ValetudoConsumable.TYPE.BIN,
                        subType: ValetudoConsumable.SUB_TYPE.DOCK,
                        unit: ValetudoConsumable.UNITS.PERCENT,
                        maxValue: 100
                    },
                );
                break;
            case RoborockConst.DOCK_TYPE.AUTO_EMPTY:
                availableConsumables.push(
                    {
                        type: ValetudoConsumable.TYPE.BIN,
                        subType: ValetudoConsumable.SUB_TYPE.DOCK,
                        unit: ValetudoConsumable.UNITS.PERCENT,
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
    [ValetudoConsumable.TYPE.BRUSH]: {
        [ValetudoConsumable.SUB_TYPE.MAIN]: "main_brush_work_time",
        [ValetudoConsumable.SUB_TYPE.SIDE_RIGHT]: "side_brush_work_time",
        [ValetudoConsumable.SUB_TYPE.DOCK]: "cleaning_brush_work_times"
    },
    [ValetudoConsumable.TYPE.FILTER]: {
        [ValetudoConsumable.SUB_TYPE.MAIN]: "filter_work_time",
        [ValetudoConsumable.SUB_TYPE.DOCK]: "strainer_work_times"
    },
    [ValetudoConsumable.TYPE.CLEANING]: {
        [ValetudoConsumable.SUB_TYPE.SENSOR]: "sensor_dirty_time"
    },
    [ValetudoConsumable.TYPE.BIN]: {
        [ValetudoConsumable.SUB_TYPE.DOCK]: "dust_collection_work_times"
    }
});

module.exports = RoborockConsumableMonitoringCapability;
