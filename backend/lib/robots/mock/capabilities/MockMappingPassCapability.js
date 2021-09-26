const {MappingPassCapability} = require("../../../core/capabilities");

/**
 * @extends MappingPassCapability<import("../MockRobot")>
 */
class MockMappingPassCapability extends MappingPassCapability {
    /**
     * @returns {Promise<void>}
     */
    async startMapping() {
        return;
    }
}

module.exports = MockMappingPassCapability;
