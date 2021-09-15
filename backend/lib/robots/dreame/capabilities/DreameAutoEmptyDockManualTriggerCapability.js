const AutoEmptyDockManualTriggerCapability = require("../../../core/capabilities/AutoEmptyDockManualTriggerCapability");
const DreameMiotHelper = require("../DreameMiotHelper");

/**
 * @extends AutoEmptyDockManualTriggerCapability<import("../DreameValetudoRobot")>
 */
class DreameAutoEmptyDockManualTriggerCapability extends AutoEmptyDockManualTriggerCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.aiid MIOT Action ID
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.aiid = options.aiid;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }
    /**
     * @returns {Promise<void>}
     */
    async triggerAutoEmpty() {
        await this.helper.executeAction(this.siid, this.aiid);
    }
}

module.exports = DreameAutoEmptyDockManualTriggerCapability;
