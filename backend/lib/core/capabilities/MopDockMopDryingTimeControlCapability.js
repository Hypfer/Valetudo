const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MopDockMopDryingTimeControlCapability extends Capability {
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
     * @returns {Promise<MopDockMopDryingTimeDuration>}
     */
    async getDuration() {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {MopDockMopDryingTimeDuration} newDuration
     * @returns {Promise<void>}
     */
    async setDuration(newDuration) {
        throw new NotImplementedError();
    }

    /**
     * @returns {{supportedDurations: Array<MopDockMopDryingTimeDuration>}}
     */
    getProperties() {
        return {
            supportedDurations: [],
        };
    }

    getType() {
        return MopDockMopDryingTimeControlCapability.TYPE;
    }
}

MopDockMopDryingTimeControlCapability.TYPE = "MopDockMopDryingTimeControlCapability";

/**
 *  @typedef {string} MopDockMopDryingTimeDuration
 *  @enum {string}
 *
 */
MopDockMopDryingTimeControlCapability.DURATION = Object.freeze({
    TWO_HOURS: "2h",
    THREE_HOURS: "3h",
    FOUR_HOURS: "4h",
    COLD: "cold",
});


module.exports = MopDockMopDryingTimeControlCapability;

