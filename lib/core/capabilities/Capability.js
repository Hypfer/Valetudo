const NotImplementedError = require("../NotImplementedError");

class Capability {
    /**
     * //TODO: Ggf braucht es eine Referenz auf die Config hier
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
}

module.exports = Capability;