const ValetudoTimerAction = require("./ValetudoTimerAction");
const GoToLocationCapability = require("../../core/capabilities/GoToLocationCapability");

class ValetudoGoToTimerAction extends ValetudoTimerAction {
    /**
     * @param {object} options
     * @param {import("../../core/ValetudoRobot")} options.robot
     * @param {string} options.goToId
     */
    constructor(options) {
        super(options);

        this.goToId = options.goToId;
    }

    async run() {
        if (!this.goToId) {
            throw new Error("Missing goToId");
        }

        if (!this.robot.hasCapability(GoToLocationCapability.TYPE)) {
            throw new Error("Robot is missing the GoToLocationCapability");
        } else {
            const capability = this.robot.capabilities[GoToLocationCapability.TYPE];
            const goToLocationPreset = this.robot.config.get("goToLocationPresets")[this.goToId];

            if (goToLocationPreset) {
                return capability.goTo(goToLocationPreset);
            } else {
                throw new Error("There is no go to location preset with id " + this.goToId);
            }
        }
    }
}

module.exports = ValetudoGoToTimerAction;
