const AutoEmptyDockManualTriggerCapability = require("../../../core/capabilities/AutoEmptyDockManualTriggerCapability");
const DreameMiotHelper = require("../DreameMiotHelper");
const DreameMiotServices = require("../DreameMiotServices");

/**
 * @extends AutoEmptyDockManualTriggerCapability<import("../DreameValetudoRobot")>
 */
class DreameAutoEmptyDockManualTriggerCapability extends AutoEmptyDockManualTriggerCapability {
    /**
     *
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        super(options);

        this.siid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.SIID;
        this.aiid = DreameMiotServices["GEN2"].AUTO_EMPTY_DOCK.ACTIONS.EMPTY_DUSTBIN.AIID;

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
