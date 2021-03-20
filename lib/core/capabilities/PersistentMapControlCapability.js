const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");


/*
    Control whether or not the robot should persist its map and continuously work with it
    instead of creating a new one on each cleanup

    Why would you turn this off? Stop!
 */
class PersistentMapControlCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        throw new NotImplementedError();
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        throw new NotImplementedError();
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        throw new NotImplementedError();
    }

    getType() {
        return PersistentMapControlCapability.TYPE;
    }
}

PersistentMapControlCapability.TYPE = "PersistentMapControlCapability";

module.exports = PersistentMapControlCapability;
