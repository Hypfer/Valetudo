const PendingMapChangeHandlingCapability = require("../../../core/capabilities/PendingMapChangeHandlingCapability");

/**
 * @extends PendingMapChangeHandlingCapability<import("../MockValetudoRobot")>
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
        //intentional
    }

    /**
     * @returns {Promise<void>}
     */
    async rejectChange() {
        //intentional
    }
}

module.exports = MockPendingMapChangeHandlingCapability;
