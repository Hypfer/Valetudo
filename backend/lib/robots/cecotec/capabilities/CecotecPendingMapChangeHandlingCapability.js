const PendingMapChangeHandlingCapability = require("../../../core/capabilities/PendingMapChangeHandlingCapability");


/**
 * @extends PendingMapChangeHandlingCapability<import("../CecotecCongaRobot")>
 */
class CecotecPendingMapChangeHandlingCapability extends PendingMapChangeHandlingCapability {
    /**
     * @returns {Promise<boolean>}
     */
    async hasPendingChange() {
        return this.robot?.robot.device.hasWaitingMap;
    }

    /**
     * @returns {Promise<void>}
     */
    async acceptChange() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        return this.robot.robot.saveWaitingMap(true);
    }

    /**
     * @returns {Promise<void>}
     */
    async rejectChange() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        return this.robot.robot.saveWaitingMap(false);
    }
}

module.exports = CecotecPendingMapChangeHandlingCapability;
