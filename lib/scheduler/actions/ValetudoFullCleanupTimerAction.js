const BasicControlCapability = require("../../core/capabilities/BasicControlCapability");
const ValetudoTimerAction = require("./ValetudoTimerAction");

class ValetudoFullCleanupTimerAction extends ValetudoTimerAction {
    async run() {
        if (!this.robot.hasCapability(BasicControlCapability.TYPE)) {
            throw new Error("Robot is missing the BasicControlCapability");
        } else {
            return this.robot.capabilities[BasicControlCapability.TYPE].start();
        }
    }
}

module.exports = ValetudoFullCleanupTimerAction;
