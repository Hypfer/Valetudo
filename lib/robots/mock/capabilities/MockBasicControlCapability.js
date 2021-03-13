const BasicControlCapability = require("../../../core/capabilities/BasicControlCapability");
const entities = require("../../../entities");
const stateAttrs = entities.state.attributes;

class MockBasicControlCapability extends BasicControlCapability {
    constructor(options) {
        super(options);

        this.StateAttr = new stateAttrs.StatusStateAttribute({
            value: stateAttrs.StatusStateAttribute.VALUE.DOCKED,
            flag: stateAttrs.StatusStateAttribute.FLAG.NONE
        });

        this.robot.state.upsertFirstMatchingAttribute(this.StateAttr);
    }

    async start() {
        this.StateAttr.value = stateAttrs.StatusStateAttribute.VALUE.CLEANING;
    }

    async stop() {
        this.StateAttr.value = stateAttrs.StatusStateAttribute.VALUE.IDLE;
    }

    async pause() {
        this.StateAttr.value = stateAttrs.StatusStateAttribute.VALUE.PAUSED;
    }

    async home() {
        this.StateAttr.value = stateAttrs.StatusStateAttribute.VALUE.DOCKED;
    }
}

module.exports = MockBasicControlCapability;