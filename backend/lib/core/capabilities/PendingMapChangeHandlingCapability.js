const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * Naming this is surprisingly hard.
 *
 * Anyways, this shall contain logic to handle the button presses which in the original app
 * pop up when the robot thinks that it has discovered a new map but wants user confirmation
 * to do anything with it such as overwriting the old one.
 */


/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class PendingMapChangeHandlingCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<boolean>}
     */
    async hasPendingChange() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async acceptChange() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async rejectChange() {
        throw new NotImplementedError();
    }

    getType() {
        return PendingMapChangeHandlingCapability.TYPE;
    }
}

PendingMapChangeHandlingCapability.TYPE = "PendingMapChangeHandlingCapability";

module.exports = PendingMapChangeHandlingCapability;
