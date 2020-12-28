const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class GoToLocationCapability extends Capability {
    /**
     * @abstract
     * @param {import("../../entities/core/ValetudoGoToLocation")} valetudoGoToLocation
     * @returns {Promise<void>}
     */
    async goTo(valetudoGoToLocation) {
        throw new NotImplementedError();
    }

    getType() {
        return GoToLocationCapability.TYPE;
    }
}

GoToLocationCapability.TYPE = "GoToLocationCapability";

module.exports = GoToLocationCapability;