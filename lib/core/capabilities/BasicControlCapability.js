const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class BasicControlCapability extends Capability {

    /**
     * The most basic functionalities
     *
     * @param options {object}
     * @param options.robot {import("../ValetudoRobot")|any}
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