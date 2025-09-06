const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MopDockMopWashTemperatureControlCapability extends Capability {
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
     * @returns {Promise<MopDockMopWashTemperatureControlCapabilityTemperature>}
     */
    async getTemperature() {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {MopDockMopWashTemperatureControlCapabilityTemperature} newTemperature
     * @returns {Promise<void>}
     */
    async setTemperature(newTemperature) {
        throw new NotImplementedError();
    }

    /**
     * @returns {{supportedTemperatures: Array<MopDockMopWashTemperatureControlCapabilityTemperature>}}
     */
    getProperties() {
        return {
            supportedTemperatures: []
        };
    }

    getType() {
        return MopDockMopWashTemperatureControlCapability.TYPE;
    }
}

MopDockMopWashTemperatureControlCapability.TYPE = "MopDockMopWashTemperatureControlCapability";

/**
 *  @typedef {string} MopDockMopWashTemperatureControlCapabilityTemperature
 *  @enum {string}
 *
 */
MopDockMopWashTemperatureControlCapability.TEMPERATURE = Object.freeze({
    COLD: "cold",
    WARM: "warm",
    HOT: "hot",
    SCALDING: "scalding",
    BOILING: "boiling"
});


module.exports = MopDockMopWashTemperatureControlCapability;
