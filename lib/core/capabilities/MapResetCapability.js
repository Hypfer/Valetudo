const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class MapResetCapability extends Capability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
        throw new NotImplementedError();
    }

    getType() {
        return MapResetCapability.TYPE;
    }
}

MapResetCapability.TYPE = "MapResetCapability";

module.exports = MapResetCapability;
