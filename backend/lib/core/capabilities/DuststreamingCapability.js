const NotImplementedError = require("../NotImplementedError");
const ValetudoBasedCapability = require("./ValetudoBasedCapability");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends ValetudoBasedCapability<T>
 */
class DuststreamingCapability extends ValetudoBasedCapability {
    /**
     * @param {object} options
     * @param {T} options.robot
     * @param {object} options.dimensions
     * @param {number} options.dimensions.width
     * @param {number} options.dimensions.height
     */
    constructor(options) {
        super(options);

        this.dimensions = options.dimensions;
    }

    /**
     * @abstract
     * @returns {boolean}
     */
    isDuststreamerInstalled() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {any} subscriber
     */
    register(subscriber) {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async selfDestruct() {
        throw new NotImplementedError();
    }

    /**
     * @returns {{width: number, height: number, duststreamerInstalled: boolean}}
     */
    getProperties() {
        return {
            width: this.dimensions.width,
            height: this.dimensions.height,
            duststreamerInstalled: this.isDuststreamerInstalled()
        };
    }

    getType() {
        return DuststreamingCapability.TYPE;
    }
}

DuststreamingCapability.TYPE = "DuststreamingCapability";

module.exports = DuststreamingCapability;
