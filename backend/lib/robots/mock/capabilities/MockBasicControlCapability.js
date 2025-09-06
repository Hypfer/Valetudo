const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const entities = require("../../../entities");
const stateAttrs = entities.state.attributes;

/**
 * @extends BasicControlCapability<import("../MockValetudoRobot")>
 */
class MockBasicControlCapability extends BasicControlCapability {
    /**
     * @param {object} options
     * @param {import("../MockValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.StatusStateAttr = new stateAttrs.StatusStateAttribute({
            value: stateAttrs.StatusStateAttribute.VALUE.DOCKED,
            flag: stateAttrs.StatusStateAttribute.FLAG.NONE
        });
        this.robot.state.upsertFirstMatchingAttribute(this.StatusStateAttr);

        this.BatteryStateAttr = new stateAttrs.BatteryStateAttribute({ level: 100 });
        this.robot.state.upsertFirstMatchingAttribute(this.BatteryStateAttr);
        setInterval(() => {
            if (this.StatusStateAttr.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED && this.BatteryStateAttr.level < 100) {
                this.BatteryStateAttr.level++;
            } else if (this.StatusStateAttr.value !== stateAttrs.StatusStateAttribute.VALUE.DOCKED && this.BatteryStateAttr.level > 0) {
                this.BatteryStateAttr.level--;
            }
        }, 5 * 1000);
    }

    async start() {
        this.StatusStateAttr.value = stateAttrs.StatusStateAttribute.VALUE.CLEANING;
    }

    async stop() {
        this.StatusStateAttr.value = stateAttrs.StatusStateAttribute.VALUE.IDLE;
    }

    async pause() {
        this.StatusStateAttr.value = stateAttrs.StatusStateAttribute.VALUE.PAUSED;
    }

    async home() {
        this.StatusStateAttr.value = stateAttrs.StatusStateAttribute.VALUE.RETURNING;
        setTimeout(() => {
            this.StatusStateAttr.value = stateAttrs.StatusStateAttribute.VALUE.DOCKED;
        }, 10 * 1000);
    }
}

module.exports = MockBasicControlCapability;
