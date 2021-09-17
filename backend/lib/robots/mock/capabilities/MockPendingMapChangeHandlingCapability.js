const PendingMapChangeHandlingCapability = require("../../../core/capabilities/PendingMapChangeHandlingCapability");

/**
 * @extends PendingMapChangeHandlingCapability<import("../MockRobot")>
 */
class MockPendingMapChangeHandlingCapability extends PendingMapChangeHandlingCapability {
    /**
     * @returns {Promise<boolean>}
     */
    async hasPendingChange() {
        return this.robot?.state?.map?.metaData?.pendingMapChange === true;
    }

    /**
     * @returns {Promise<void>}
     */
    async acceptChange() {

    }

    /**
     * @returns {Promise<void>}
     */
    async rejectChange() {

    }
}

module.exports = MockPendingMapChangeHandlingCapability;
