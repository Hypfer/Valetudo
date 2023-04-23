const OperationModeControlCapability = require("../../core/capabilities/OperationModeControlCapability");
const ValetudoPresetSelectionTimerPreAction = require("./ValetudoPresetSelectionTimerPreAction");

class ValetudoOperationModeControlTimerPreAction extends ValetudoPresetSelectionTimerPreAction {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} options.value
     */
    constructor(options) {
        super({
            ...options,
            capability_type: OperationModeControlCapability.TYPE
        });
    }
}

module.exports = ValetudoOperationModeControlTimerPreAction;
