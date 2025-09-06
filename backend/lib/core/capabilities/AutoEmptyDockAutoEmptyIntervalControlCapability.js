const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class AutoEmptyDockAutoEmptyIntervalControlCapability extends Capability {
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
     * @returns {Promise<AutoEmptyDockAutoEmptyIntervalControlCapabilityInterval>}
     */
    async getInterval() {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {AutoEmptyDockAutoEmptyIntervalControlCapabilityInterval} newMode
     * @returns {Promise<void>}
     */
    async setInterval(newMode) {
        throw new NotImplementedError();
    }

    /**
     * @returns {{supportedIntervals: Array<AutoEmptyDockAutoEmptyIntervalControlCapabilityInterval>}}
     */
    getProperties() {
        return {
            supportedIntervals: []
        };
    }

    getType() {
        return AutoEmptyDockAutoEmptyIntervalControlCapability.TYPE;
    }
}

AutoEmptyDockAutoEmptyIntervalControlCapability.TYPE = "AutoEmptyDockAutoEmptyIntervalControlCapability";

/**
 *  @typedef {string} AutoEmptyDockAutoEmptyIntervalControlCapabilityInterval
 *  @enum {string}
 *
 */
AutoEmptyDockAutoEmptyIntervalControlCapability.INTERVAL = Object.freeze({
    OFF: "off",
    INFREQUENT: "infrequent",
    NORMAL: "normal",
    FREQUENT: "frequent",
});


module.exports = AutoEmptyDockAutoEmptyIntervalControlCapability;

