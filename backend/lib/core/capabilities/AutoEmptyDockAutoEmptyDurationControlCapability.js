const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class AutoEmptyDockAutoEmptyDurationControlCapability extends Capability {
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
     * @returns {Promise<AutoEmptyDockAutoEmptyDuration>}
     */
    async getDuration() {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {AutoEmptyDockAutoEmptyDuration} newDuration
     * @returns {Promise<void>}
     */
    async setDuration(newDuration) {
        throw new NotImplementedError();
    }

    /**
     * @returns {{supportedDurations: Array<AutoEmptyDockAutoEmptyDuration>}}
     */
    getProperties() {
        return {
            supportedDurations: []
        };
    }

    getType() {
        return AutoEmptyDockAutoEmptyDurationControlCapability.TYPE;
    }
}

AutoEmptyDockAutoEmptyDurationControlCapability.TYPE = "AutoEmptyDockAutoEmptyDurationControlCapability";

/**
 *  @typedef {string} AutoEmptyDockAutoEmptyDuration
 *  @enum {string}
 *
 */
AutoEmptyDockAutoEmptyDurationControlCapability.DURATION = Object.freeze({
    AUTO: "auto",
    SHORT: "short",
    MEDIUM: "medium",
    LONG: "long",
});


module.exports = AutoEmptyDockAutoEmptyDurationControlCapability;

