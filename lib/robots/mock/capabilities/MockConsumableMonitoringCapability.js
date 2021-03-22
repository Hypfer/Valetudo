const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");

const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");
const stateAttrs = require("../../../entities/state/attributes");

const MOCKED_CONSUMABLES = Object.freeze([
    {
        type: ConsumableStateAttribute.TYPE.BRUSH,
        subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
        serviceLife: 60
    },
    {
        type: ConsumableStateAttribute.TYPE.BRUSH,
        subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
        serviceLife: 30
    },
    {
        type: ConsumableStateAttribute.TYPE.FILTER,
        subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
        serviceLife: 10
    },
    {
        type: ConsumableStateAttribute.TYPE.SENSOR,
        subType: ConsumableStateAttribute.SUB_TYPE.ALL,
        serviceLife: 5
    },
    {
        type: ConsumableStateAttribute.TYPE.MOP,
        subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
        serviceLife: 1
    },
]);

class MockConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    constructor(options) {
        super(options);
        this.remaining = MOCKED_CONSUMABLES.map(c => ({
            current: c.serviceLife,
            initial: c.serviceLife
        }));

        setInterval(() => {
            const statusStateAttribute = this.robot.state.getFirstMatchingAttribute({
                attributeClass: stateAttrs.StatusStateAttribute.name
            });

            if (statusStateAttribute && statusStateAttribute.isActiveState) {
                this.remaining.forEach(r => r.current = Math.max(0, r.current - 1));
            }
        }, 60 * 1000);
    }

    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/state/attributes/ConsumableStateAttribute")>>}
     */
    async getConsumables() {
        const consumables = MOCKED_CONSUMABLES.map((c, idx) => {
            const remaining = this.remaining[idx].current;
            return new ConsumableStateAttribute({
                type: c.type,
                subType: c.subType,
                remaining: {
                    value: remaining,
                    unit: ConsumableStateAttribute.UNITS.MINUTES
                },
                metaData: {
                    consumableIndex: idx
                }
            });
        });

        consumables.forEach(c => this.robot.state.upsertFirstMatchingAttribute(c));

        this.robot.emitStateUpdated();

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
            this.remaining[consumable.metaData.consumableIndex].current = this.remaining[consumable.metaData.consumableIndex].initial;
        } else {
            throw new Error("No such consumable");
        }
    }
}

module.exports = MockConsumableMonitoringCapability;
