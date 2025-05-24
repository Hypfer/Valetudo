const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");


/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class HighResolutionManualControlCapability extends Capability {
    /**
     *
     * @param {object} options
     * @param {T} options.robot
     * @class
     */
    constructor(options) {
        super(options);
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
     * @return {Promise<boolean>}
     */
    async manualControlActive() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {import("../../entities/core/ValetudoManualMovementVector")} movementVector
     * @returns {Promise<void>}
     */
    async manualControl(movementVector) {
        throw new NotImplementedError();
    }


    getType() {
        return HighResolutionManualControlCapability.TYPE;
    }
}

HighResolutionManualControlCapability.TYPE = "HighResolutionManualControlCapability";


module.exports = HighResolutionManualControlCapability;
