const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class CarpetSensorModeControlCapability extends Capability {
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
     * @returns {Promise<CarpetSensorModeControlCapabilityMode>}
     */
    async getMode() {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {CarpetSensorModeControlCapabilityMode} newMode
     * @returns {Promise<void>}
     */
    async setMode(newMode) {
        throw new NotImplementedError();
    }

    /**
     * @returns {{supportedModes: Array<CarpetSensorModeControlCapabilityMode>}}
     */
    getProperties() {
        return {
            supportedModes: []
        };
    }

    getType() {
        return CarpetSensorModeControlCapability.TYPE;
    }
}

CarpetSensorModeControlCapability.TYPE = "CarpetSensorModeControlCapability";

/**
 *  @typedef {string} CarpetSensorModeControlCapabilityMode
 *  @enum {string}
 *
 */
CarpetSensorModeControlCapability.MODE = Object.freeze({
    OFF: "off",
    AVOID: "avoid",
    LIFT: "lift",
    DETACH: "detach"
});


module.exports = CarpetSensorModeControlCapability;

