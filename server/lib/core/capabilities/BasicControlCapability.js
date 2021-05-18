const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class BasicControlCapability extends Capability {

    /**
     * The most basic functionalities
     *
     * @param {object} options
     * @param {T} options.robot
     */
    constructor(options) {
        super(options);
    }


    /**
     * Also resume if paused
     *
     * @abstract
     * @returns {Promise<void>}
     */
    async start() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async stop() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async pause() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async home() {
        throw new NotImplementedError();
    }

    getType() {
        return BasicControlCapability.TYPE;
    }
}

BasicControlCapability.TYPE = "BasicControlCapability";

module.exports = BasicControlCapability;
