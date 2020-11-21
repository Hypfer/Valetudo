const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");


/*
    Plays some kind of sound, flashes a light etc to find the robot
 */
class LocateCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async locate() {
        throw new NotImplementedError();
    }

    getType() {
        return LocateCapability.TYPE;
    }
}

LocateCapability.TYPE = "LocateCapability";

module.exports = LocateCapability;