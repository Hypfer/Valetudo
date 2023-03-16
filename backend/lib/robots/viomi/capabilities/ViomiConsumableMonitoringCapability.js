const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");

const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");

/**
 * @extends ConsumableMonitoringCapability<import("../ViomiValetudoRobot")>
 */
class ViomiConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/state/attributes/ConsumableStateAttribute")>>}
     */
    async getConsumables() {
        const data = await this.robot.sendCommand("get_consumables");
        const rawConsumables = {
            mainBrush: data[0],
            sideBrush: data[1],
            filter: data[2],
            mop: data[3]
        };

        const consumables = [
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, (360 - rawConsumables.mainBrush) * 60)),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                remaining: {
                    value: Math.round(Math.max(0, (180 - rawConsumables.sideBrush) * 60)),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.FILTER,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, (180 - rawConsumables.filter) * 60)),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.MOP,  // According to python-miio, unverified
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, (180 - rawConsumables.mop) * 60)),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
        ];

        consumables.forEach(c => {
            return this.robot.state.upsertFirstMatchingAttribute(c);
        });

        this.robot.emitStateAttributesUpdated();

        return consumables;
    }

    /**
     * @abstract
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        let idx;

        switch (type) {
            case ConsumableStateAttribute.TYPE.BRUSH:
                switch (subType) {
                    case ConsumableStateAttribute.SUB_TYPE.MAIN:
                        idx = 1;
                        break;
                    case ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT:
                        idx = 2;
                        break;
                }
                break;
            case ConsumableStateAttribute.TYPE.FILTER:
                switch (subType) {
                    case ConsumableStateAttribute.SUB_TYPE.MAIN:
                        idx = 3;
                        break;
                }
                break;
            case ConsumableStateAttribute.TYPE.MOP:
                switch (subType) {
                    case ConsumableStateAttribute.SUB_TYPE.MAIN:
                        idx = 4;
                        break;
                }
                break;
        }

        if (idx) {
            await this.robot.sendCommand("set_consumables", [idx, 0], {});
        } else {
            throw new Error("No such consumable");
        }
    }

    getProperties() {
        return {
            availableConsumables: [
                {
                    type: ConsumableStateAttribute.TYPE.BRUSH,
                    subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                    unit: ConsumableStateAttribute.UNITS.MINUTES,
                    maxValue: 360 * 60
                },
                {
                    type: ConsumableStateAttribute.TYPE.BRUSH,
                    subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                    unit: ConsumableStateAttribute.UNITS.MINUTES,
                    maxValue: 180 * 60
                },
                {
                    type: ConsumableStateAttribute.TYPE.FILTER,
                    subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                    unit: ConsumableStateAttribute.UNITS.MINUTES,
                    maxValue: 180 * 60
                }
            ]
        };
    }
}

module.exports = ViomiConsumableMonitoringCapability;
