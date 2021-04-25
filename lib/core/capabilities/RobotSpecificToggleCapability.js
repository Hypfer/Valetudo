const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class RobotSpecificToggleCapability extends Capability {
    /**
     * Returns the toggle types this robot supports
     *
     * @abstract
     * @returns {Array<string>}
     */
    getSupportedToggleTypes() {
        throw new NotImplementedError();
    }

    /**
     * This function updates and returns the supported robot specific toggles and their values.
     *
     * @returns {Promise<Array<import("../../entities/state/attributes/RobotSpecificToggleStateAttribute")>>}
     */
    async getToggles() {
        const result = [];
        for (const type of this.getSupportedToggleTypes()) {
            result.push(await this.getToggle({type: type}));
        }
        return result;
    }

    /**
     * This function updates and returns one supported robot specific toggle and its values
     *
     * @abstract
     * @param {object} options
     * @param {string} options.type
     * @return {Promise<import("../../entities/state/attributes/RobotSpecificToggleStateAttribute")>}
     */
    async getToggle(options) {
        throw new NotImplementedError();
    }

    /**
     * Sets a robot toggle to a specific value.
     *
     * @param {object} options
     * @param {string} options.type
     * @param {boolean} options.value
     * @returns {Promise<void>}
     */
    async setToggle(options) {
        throw new NotImplementedError();
    }

    getType() {
        return RobotSpecificToggleCapability.TYPE;
    }
}

RobotSpecificToggleCapability.TYPE = "RobotSpecificToggleCapability";

module.exports = RobotSpecificToggleCapability;
