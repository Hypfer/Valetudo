const FanSpeedControlCapability = require("../../core/capabilities/FanSpeedControlCapability");
const ValetudoPresetSelectionTimerPreAction = require("./ValetudoPresetSelectionTimerPreAction");

class ValetudoFanSpeedControlTimerPreAction extends ValetudoPresetSelectionTimerPreAction {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} options.value
     */
    constructor(options) {
        super({
            ...options,
            capability_type: FanSpeedControlCapability.TYPE
        });
    }
}

module.exports = ValetudoFanSpeedControlTimerPreAction;
