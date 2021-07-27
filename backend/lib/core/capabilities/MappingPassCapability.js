const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * Some robots may allow for or even require a mapping pass instead of building the map as they go.
 *
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MappingPassCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async startMapping() {
        throw new NotImplementedError();
    }

    getType() {
        return MappingPassCapability.TYPE;
    }
}

MappingPassCapability.TYPE = "MappingPassCapability";

module.exports = MappingPassCapability;
