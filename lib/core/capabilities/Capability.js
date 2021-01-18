const NotImplementedError = require("../NotImplementedError");

class Capability {
    /**
     *
     * @param {object} options
     * @param {import("../ValetudoRobot")|any} options.robot
     * @class
     */
    constructor(options) {
        this.type = this.getType();
        this.robot = options.robot;
    }

    /**
     * @abstract
     * @returns {string}
     */
    getType() {
        throw new NotImplementedError();
    }

    /**
     * This may contain capability-specific information, restrictions etc, which can't be handled
     * by splitting the problem into seperate capabilities
     *
     * @returns {object}
     */
    getProperties() {
        return {};
    }
}

module.exports = Capability;
