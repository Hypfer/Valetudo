const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class CleanRouteControlCapability extends Capability {
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
     * @returns {Promise<CleanRouteControlCapabilityRoute>}
     */
    async getRoute() {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {CleanRouteControlCapabilityRoute} newRoute
     * @returns {Promise<void>}
     */
    async setRoute(newRoute) {
        throw new NotImplementedError();
    }

    /**
     * @returns {{supportedRoutes: Array<CleanRouteControlCapabilityRoute>, mopOnly: Array<CleanRouteControlCapabilityRoute>, oneTime: Array<CleanRouteControlCapabilityRoute>}}
     */
    getProperties() {
        return {
            supportedRoutes: [],
            mopOnly: [],
            oneTime: []
        };
    }

    getType() {
        return CleanRouteControlCapability.TYPE;
    }
}

CleanRouteControlCapability.TYPE = "CleanRouteControlCapability";

/**
 *  @typedef {string} CleanRouteControlCapabilityRoute
 *  @enum {string}
 *
 */
CleanRouteControlCapability.ROUTE = Object.freeze({
    NORMAL: "normal",
    QUICK: "quick",
    INTENSIVE: "intensive",
    DEEP: "deep",
});


module.exports = CleanRouteControlCapability;

