const ManualControlCapability = require("../../../core/capabilities/ManualControlCapability");
const { FORWARD, BACKWARD, ROTATE_CLOCKWISE, ROTATE_COUNTERCLOCKWISE } = ManualControlCapability.MOVEMENT_COMMAND_TYPE;
const { MANUAL_MODE } = require("@agnoc/core");

const COMMAND_MAP = {
    [FORWARD]: MANUAL_MODE.forward,
    [BACKWARD]: MANUAL_MODE.backward,
    [ROTATE_CLOCKWISE]: MANUAL_MODE.right,
    [ROTATE_COUNTERCLOCKWISE]: MANUAL_MODE.left,
};

/**
 * @extends ManualControlCapability<import("../CecotecCongaRobot")>
 */
module.exports = class CecotecManualControlCapability extends ManualControlCapability {
    constructor(options) {
        super(Object.assign({}, options, {
            supportedMovementCommands: [
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE
            ]
        }));
    }

    async enterManualControl() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.enterManualMode();
    }

    async leaveManualControl() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.leaveManualMode();
    }

    /**
     * @param {import("../../../core/capabilities/ManualControlCapability").ValetudoManualControlMovementCommandType} movementCommand
     * @returns {Promise<void>}
     */
    async manualControl(movementCommand) {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        const mode = COMMAND_MAP[movementCommand];

        if (!mode) {
            throw new Error("Unknown manual control model");
        }

        await this.robot.robot.setManualMode(mode);
    }

};
