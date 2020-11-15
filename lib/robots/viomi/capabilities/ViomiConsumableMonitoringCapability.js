const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");

const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");

class ViomiConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/state/attributes/ConsumableStateAttribute")>>}
     */
    async getConsumables() {
        const data = await this.robot.sendCommand("get_consumable");
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
                    value: Math.round(Math.max(0, 360*60 - (rawConsumables.mainBrush / 60))),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.BRUSH,
                subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
                remaining: {
                    value: Math.round(Math.max(0, 180*60 - (rawConsumables.sideBrush / 60))),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.FILTER,
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, 180*60 - (rawConsumables.filter / 60))),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
            new ConsumableStateAttribute({
                type: ConsumableStateAttribute.TYPE.BRUSH.MOP,  // According to python-miio, unverified
                subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, 180*60 - (rawConsumables.mop / 60))),
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                }
            }),
        ];

        consumables.forEach(c => this.robot.state.upsertFirstMatchingAttribute(c));

        this.robot.emitStateUpdated();

        return consumables;
    }

    /**
     * @abstract
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async resetConsumable(type, subType) {
        throw new Error("Not implemented");
    }
}

module.exports = ViomiConsumableMonitoringCapability;