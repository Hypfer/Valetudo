const NotImplementedError = require("../NotImplementedError");

class Capability {
    /**
     * //TODO: Ggf braucht es eine Referenz auf die Config hier
     * @param options {object}
     * @param options.robot {import("../ValetudoRobot")|any}
     * @constructor
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