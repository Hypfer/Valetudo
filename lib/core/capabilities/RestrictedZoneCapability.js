const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class RestrictedZoneCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<Array<import("../../entities/core/ValetudoRestrictedZone")>>}
     */
    async getRestrictedZones() {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {Array<import("../../entities/core/ValetudoRestrictedZone")>} restrictedZones
     * @returns {Promise<void>}
     */
    async setRestrictedZones(restrictedZones) {
        throw new NotImplementedError();
    }

    getType() {
        return RestrictedZoneCapability.TYPE;
    }
}

RestrictedZoneCapability.TYPE = "RestrictedZoneCapability";

module.exports = RestrictedZoneCapability;