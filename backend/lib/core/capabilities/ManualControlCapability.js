const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");


/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class ManualControlCapability extends Capability {
    /**
     *
     * @param {object} options
     * @param {T} options.robot
     * @param {Array<ValetudoManualControlMovementCommandType>} options.supportedMovementCommands
     * @class
     */
    constructor(options) {
        super(options);

        this.supportedMovementCommands = options.supportedMovementCommands;
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enableManualControl() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async disableManualControl() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {ValetudoManualControlMovementCommandType} movementCommand
     * @returns {Promise<void>}
     */
    async manualControl(movementCommand) {
        throw new NotImplementedError();
    }

    getProperties() {
        return {
            supportedMovementCommands: this.supportedMovementCommands
        };
    }

    getType() {
        return ManualControlCapability.TYPE;
    }
}

ManualControlCapability.TYPE = "ManualControlCapability";

/**
 *  @typedef {string} ValetudoManualControlMovementCommandType
 *  @enum {string}
 *
 */
ManualControlCapability.MOVEMENT_COMMAND_TYPE = Object.freeze({
    FORWARD: "forward",
    BACKWARD: "backward",
    ROTATE_CLOCKWISE: "rotate_clockwise",
    ROTATE_COUNTERCLOCKWISE: "rotate_counterclockwise"
});


module.exports = ManualControlCapability;
