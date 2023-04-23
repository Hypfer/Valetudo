const ValetudoPresetSelectionTimerPreAction = require("./ValetudoPresetSelectionTimerPreAction");
const WaterUsageControlCapability = require("../../core/capabilities/WaterUsageControlCapability");

class ValetudoWaterUsageControlTimerPreAction extends ValetudoPresetSelectionTimerPreAction {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} options.value
     */
    constructor(options) {
        super({
            ...options,
            capability_type: WaterUsageControlCapability.TYPE
        });
    }
}

module.exports = ValetudoWaterUsageControlTimerPreAction;
