const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * To avoid a race condition on robots where both walls and zones are the same data type
 * this capability is both.
 *
 * Honestly, every robot should be like this. Only supporting one of the two is questionable
 */
class CombinedVirtualRestrictionsCapability extends Capability {
    /**
     * @abstract
     * @returns {Promise<import("../../entities/core/ValetudoVirtualRestrictions")>}
     */
    async getVirtualRestrictions() {
        throw new NotImplementedError();
    }

    /**
     *
     * @param {import("../../entities/core/ValetudoVirtualRestrictions")} virtualRestrictions
     * @returns {Promise<void>}
     */
    async setVirtualRestrictions(virtualRestrictions) {
        throw new NotImplementedError();
    }

    getType() {
        return CombinedVirtualRestrictionsCapability.TYPE;
    }
}

CombinedVirtualRestrictionsCapability.TYPE = "CombinedVirtualRestrictionsCapability";

module.exports = CombinedVirtualRestrictionsCapability;