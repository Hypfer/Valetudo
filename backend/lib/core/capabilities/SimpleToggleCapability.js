const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class SimpleToggleCapability extends Capability {
    /**
     * This function polls the current state
     *
     * @abstract
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async enable() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async disable() {
        throw new NotImplementedError();
    }
}

module.exports = SimpleToggleCapability;
