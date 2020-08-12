const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class ZoneCleaningCapability extends Capability {
    /**
     * @abstract
     * @param valetudoZones {Array<import("../../entities/core/ValetudoZone")>}
     * @returns {Promise<void>}
     */
    async start(valetudoZones) {
        throw new NotImplementedError();
    }

    getType() {
        return ZoneCleaningCapability.TYPE;
    }
}

ZoneCleaningCapability.TYPE = "ZoneCleaningCapability";

module.exports = ZoneCleaningCapability;