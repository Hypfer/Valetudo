const ConsumableMonitoringCapability = require("../../../core/capabilities/ConsumableMonitoringCapability");

const ValetudoConsumable = require("../../../entities/core/ValetudoConsumable");

/**
 * @extends ConsumableMonitoringCapability<import("../ViomiValetudoRobot")>
 */
class ViomiConsumableMonitoringCapability extends ConsumableMonitoringCapability {
    /**
     * This function polls the current consumables state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../../entities/core/ValetudoConsumable")>>}
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
            new ValetudoConsumable({
                type: ValetudoConsumable.TYPE.BRUSH,
                subType: ValetudoConsumable.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, (360 - rawConsumables.mainBrush) * 60)),
                    unit: ValetudoConsumable.UNITS.MINUTES
                }
            }),
            new ValetudoConsumable({
                type: ValetudoConsumable.TYPE.BRUSH,
                subType: ValetudoConsumable.SUB_TYPE.SIDE_RIGHT,
                remaining: {
                    value: Math.round(Math.max(0, (180 - rawConsumables.sideBrush) * 60)),
                    unit: ValetudoConsumable.UNITS.MINUTES
                }
            }),
            new ValetudoConsumable({
                type: ValetudoConsumable.TYPE.FILTER,
                subType: ValetudoConsumable.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, (180 - rawConsumables.filter) * 60)),
                    unit: ValetudoConsumable.UNITS.MINUTES
                }
            }),
            new ValetudoConsumable({
                type: ValetudoConsumable.TYPE.MOP,  // According to python-miio, unverified
                subType: ValetudoConsumable.SUB_TYPE.MAIN,
                remaining: {
                    value: Math.round(Math.max(0, (180 - rawConsumables.mop) * 60)),
                    unit: ValetudoConsumable.UNITS.MINUTES
                }
            }),
        ];

        this.raiseEventIfRequired(consumables);

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
            case ValetudoConsumable.TYPE.BRUSH:
                switch (subType) {
                    case ValetudoConsumable.SUB_TYPE.MAIN:
                        idx = 1;
                        break;
                    case ValetudoConsumable.SUB_TYPE.SIDE_RIGHT:
                        idx = 2;
                        break;
                }
                break;
            case ValetudoConsumable.TYPE.FILTER:
                switch (subType) {
                    case ValetudoConsumable.SUB_TYPE.MAIN:
                        idx = 3;
                        break;
                }
                break;
            case ValetudoConsumable.TYPE.MOP:
                switch (subType) {
                    case ValetudoConsumable.SUB_TYPE.MAIN:
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
                    type: ValetudoConsumable.TYPE.BRUSH,
                    subType: ValetudoConsumable.SUB_TYPE.MAIN,
                    unit: ValetudoConsumable.UNITS.MINUTES,
                    maxValue: 360 * 60
                },
                {
                    type: ValetudoConsumable.TYPE.BRUSH,
                    subType: ValetudoConsumable.SUB_TYPE.SIDE_RIGHT,
                    unit: ValetudoConsumable.UNITS.MINUTES,
                    maxValue: 180 * 60
                },
                {
                    type: ValetudoConsumable.TYPE.FILTER,
                    subType: ValetudoConsumable.SUB_TYPE.MAIN,
                    unit: ValetudoConsumable.UNITS.MINUTES,
                    maxValue: 180 * 60
                }
            ]
        };
    }
}

module.exports = ViomiConsumableMonitoringCapability;
