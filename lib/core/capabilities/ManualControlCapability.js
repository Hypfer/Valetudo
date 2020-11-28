const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");


/*
    Plays some kind of sound, flashes a light etc to find the robot
 */
class ManualControlCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enterManualControl() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async leaveManualControl() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {string} action
     * @param {number} [duration] - duration in milliseconds
     * @returns {Promise<void>}
     */
    async manualControl(action, duration) {
        throw new NotImplementedError();
    }

    getType() {
        return ManualControlCapability.TYPE;
    }
}

ManualControlCapability.TYPE = "ManualControlCapability";

module.exports = ManualControlCapability;