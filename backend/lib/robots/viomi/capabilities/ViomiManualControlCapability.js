const ManualControlCapability = require("../../../core/capabilities/ManualControlCapability");
const stateAttrs = require("../../../entities/state/attributes");
const ViomiManualControlDirection = require("../ViomiCommonAttributes").ViomiManualControlDirection;


/**
 * @extends ManualControlCapability<import("../ViomiValetudoRobot")>
 */
class ViomiManualControlCapability extends ManualControlCapability {
    /**
     *
     * @param {object} options
     * @param {import("../ViomiValetudoRobot")} options.robot
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
    }

    /**
     * @private
     * @param {number} direction
     * @returns {Promise<void>}
     */
    async viomiMove(direction) {
        await this.robot.sendCommand("set_direction", [direction]);
    }

    /**
     * @private
     * @returns {boolean}
     */
    isInManualControlMode() {
        const state = this.robot.state.getFirstMatchingAttributeByConstructor(stateAttrs.StatusStateAttribute);
        return !!(state && state.value === stateAttrs.StatusStateAttribute.VALUE.MANUAL_CONTROL);
    }

    /**
     * @returns {Promise<void>}
     */
    async enableManualControl() {
        if (!this.isInManualControlMode()) {
            await this.viomiMove(ViomiManualControlDirection.ENTER_EXIT);

            await this.robot.pollState();
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async disableManualControl() {
        if (this.isInManualControlMode()) {
            await this.viomiMove(ViomiManualControlDirection.ENTER_EXIT);

            await this.robot.pollState();
        }
    }

    /**
     * @returns {Promise<boolean>}
     */
    async manualControlActive() {
        return this.isInManualControlMode();
    }

    /**
     * @param {import("../../../core/capabilities/ManualControlCapability").ValetudoManualControlMovementCommandType} movementCommand
     * @returns {Promise<void>}
     */
    async manualControl(movementCommand) {
        // eslint-disable-next-line eqeqeq
        if (ViomiManualControlDirection[movementCommand] == null) {
            throw new Error("Invalid movementCommand");
        }
        await this.viomiMove(ViomiManualControlDirection[movementCommand]);
    }
}

module.exports = ViomiManualControlCapability;
