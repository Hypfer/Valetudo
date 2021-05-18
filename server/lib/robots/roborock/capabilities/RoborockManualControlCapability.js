const ManualControlCapability = require("../../../core/capabilities/ManualControlCapability");

/**
 * @extends ManualControlCapability<import("../RoborockValetudoRobot")>
 */
class RoborockManualControlCapability extends ManualControlCapability {
    /**
     *
     * @param {object} options
     * @param {import("../RoborockValetudoRobot")} options.robot
     * @class
     */
    constructor(options) {
        super(Object.assign({}, options, {
            supportedMovementCommands: [
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE,
                ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE
            ]
        }));

        this.sequenceId = 0;
    }

    /**
     * @returns {Promise<void>}
     */
    async enableManualControl() {
        this.sequenceId = 0;

        return this.robot.sendCommand("app_rc_start", [], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disableManualControl() {
        this.sequenceId = 0;

        return this.robot.sendCommand("app_rc_end", [], {});
    }

    /**
     * @param {import("../../../core/capabilities/ManualControlCapability").ValetudoManualControlMovementCommandType} movementCommand
     * @returns {Promise<void>}
     */
    async manualControl(movementCommand) {
        let angle = 0;
        let velocity = 0;

        switch (movementCommand) {
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.FORWARD:
                velocity = 0.3;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.BACKWARD:
                velocity = -0.3;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_CLOCKWISE:
                angle = (60*(Math.PI / 180)) * -1;
                break;
            case ManualControlCapability.MOVEMENT_COMMAND_TYPE.ROTATE_COUNTERCLOCKWISE:
                angle = 60*(Math.PI / 180);
                break;
            default:
                throw new Error("Invalid movementCommand.");
        }


        return this.robot.sendCommand("app_rc_move", [{
            omega: angle,
            velocity: velocity,
            seqnum: ++this.sequenceId
        }], {});
    }
}

module.exports = RoborockManualControlCapability;
