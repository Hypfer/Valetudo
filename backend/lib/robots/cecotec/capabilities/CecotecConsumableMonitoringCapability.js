const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");
const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");
const {CONSUMABLE_TYPE} = require("@agnoc/core");

const { TYPE, SUB_TYPE, UNITS } = ConsumableStateAttribute;
const MAIN_BRUSH_LIFE_TIME = 320 * 60;
const SIDE_BRUSH_LIFE_TIME = 220 * 60;
const FILTER_LIFE_TIME = 160 * 60;
const DISHCLOTH_LIFE_TIME = 100 * 60;

/**
 * @extends ConsumableMonitoringCapability<import("../CecotecCongaRobot")>
 */
module.exports = class CecotecConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    async getConsumables() {
        if (!this.robot.robot) {
            return [];
        }

        const list = await this.robot.robot.getConsumables();
        const consumables = list.map(({ type, used }) => {
            switch (type) {
                case CONSUMABLE_TYPE.MAIN_BRUSH:
                    return new ConsumableStateAttribute({
                        type: TYPE.BRUSH,
                        subType: SUB_TYPE.MAIN,
                        remaining: {
                            unit: UNITS.MINUTES,
                            value: Math.max(MAIN_BRUSH_LIFE_TIME - used, 0)
                        }
                    });
                case CONSUMABLE_TYPE.SIDE_BRUSH:
                    return new ConsumableStateAttribute({
                        type: TYPE.BRUSH,
                        subType: SUB_TYPE.SIDE_RIGHT,
                        remaining: {
                            unit: UNITS.MINUTES,
                            value: Math.max(SIDE_BRUSH_LIFE_TIME - used, 0)
                        }
                    });
                case CONSUMABLE_TYPE.FILTER:
                    return new ConsumableStateAttribute({
                        type: TYPE.FILTER,
                        subType: SUB_TYPE.MAIN,
                        remaining: {
                            unit: UNITS.MINUTES,
                            value: Math.max(FILTER_LIFE_TIME - used, 0)
                        }
                    });
                case CONSUMABLE_TYPE.DISHCLOTH:
                    return new ConsumableStateAttribute({
                        type: TYPE.MOP,
                        subType: SUB_TYPE.MAIN,
                        remaining: {
                            unit: UNITS.MINUTES,
                            value: Math.max(DISHCLOTH_LIFE_TIME - used, 0)
                        }
                    });
            }
        });

        consumables.forEach(c => this.robot.state.upsertFirstMatchingAttribute(c));

        // @ts-ignore
        this.robot.emitStateUpdated();

        return consumables;
    }

    /**
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        /**
         * @type {import("@agnoc/core").ConsumableType}
         */
        let consumable;

        if (type === TYPE.BRUSH && subType === SUB_TYPE.MAIN) {
            consumable = CONSUMABLE_TYPE.MAIN_BRUSH;
        } else if (type === TYPE.BRUSH && subType === SUB_TYPE.SIDE_RIGHT) {
            consumable = CONSUMABLE_TYPE.SIDE_BRUSH;
        } else if (type === TYPE.FILTER) {
            consumable = CONSUMABLE_TYPE.FILTER;
        } else if (type === TYPE.MOP) {
            consumable = CONSUMABLE_TYPE.DISHCLOTH;
        }

        if (consumable) {
            await this.robot.robot.resetConsumable(consumable);
        }
    }
};
