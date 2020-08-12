const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class GoToLocationCapability extends Capability {
    /**
     * @abstract
     * @param valetudoGoToLocation {import("../../entities/core/ValetudoGoToLocation")}
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