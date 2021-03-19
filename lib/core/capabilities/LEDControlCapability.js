const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class LEDControlCapability extends Capability {
    /**
     * This function polls the current LEDs state and stores the attributes in our robotState
     *
     * @abstract
     * @returns {Promise<Array<import("../../entities/state/attributes/LEDStateAttribute")>>}
     */
    async getLEDs() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {string} status
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async setLED(status, type, subType) {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async toggleLED(type, subType) {
        throw new NotImplementedError();
    }

    getType() {
        return LEDControlCapability.TYPE;
    }
}

LEDControlCapability.TYPE = "LEDControlCapability";

module.exports = LEDControlCapability;
