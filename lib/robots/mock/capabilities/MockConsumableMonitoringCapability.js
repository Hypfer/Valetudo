const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");

const ConsumableStateAttribute = require("../../../entities/state/attributes/ConsumableStateAttribute");
const stateAttrs = require("../../../entities/state/attributes");

const MOCKED_CONSUMABLES = Object.freeze([
    {
        type: ConsumableStateAttribute.TYPE.BRUSH,
        subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
        serviceLife: 60,
    },
    {
        type: ConsumableStateAttribute.TYPE.BRUSH,
        subType: ConsumableStateAttribute.SUB_TYPE.SIDE_RIGHT,
        serviceLife: 30,
    },
    {
        type: ConsumableStateAttribute.TYPE.FILTER,
        subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
        serviceLife: 10,
    },
    {
        type: ConsumableStateAttribute.TYPE.SENSOR,
        subType: ConsumableStateAttribute.SUB_TYPE.ALL,
        serviceLife: 5,
    },
    {
        type: ConsumableStateAttribute.TYPE.MOP,
        subType: ConsumableStateAttribute.SUB_TYPE.MAIN,
        serviceLife: 1,
    },
]);

/**
 * @extends ConsumableMonitoringCapability<import("../MockRobot")>
 */
class MockConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     * @param {object} options
     * @param {import("../MockRobot")} options.robot
     */
    constructor(options) {
        super(options);
        this.remaining = MOCKED_CONSUMABLES.map(c => c.serviceLife);

        setInterval(() => {
            const statusStateAttribute = this.robot.state.getFirstMatchingAttribute({
                attributeClass: stateAttrs.StatusStateAttribute.name
            });

            if (statusStateAttribute && statusStateAttribute.isActiveState) {
                this.remaining.forEach((_, idx) => this.remaining[idx] = Math.max(0, this.remaining[idx] - 1));
            }
        }, 60 * 1000);
    }

    /**
     * @returns {Promise<Array<import("../../../entities/state/attributes/ConsumableStateAttribute")>>}
     */
    async getConsumables() {
        const consumables = MOCKED_CONSUMABLES.map((c, idx) => {
            const remaining = this.remaining[idx];
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
            const index = consumable.metaData.consumableIndex;
            this.remaining[index] = MOCKED_CONSUMABLES[index].serviceLife;
        } else {
            throw new Error("No such consumable");
        }
    }
}

module.exports = MockConsumableMonitoringCapability;
