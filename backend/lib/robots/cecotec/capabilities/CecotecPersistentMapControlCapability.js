const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

/**
 * @extends PersistentMapControlCapability<import("../CecotecCongaRobot")>
 */
class CecotecPersistentMapControlCapability extends PersistentMapControlCapability {
    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        if (!this.robot.robot || !this.robot.robot.device.config) {
            return false;
        }

        return this.robot.robot.device.config.isHistoryMapEnabled;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.setHistoryMap(true);
        await this.robot.robot.updateMap();
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.setHistoryMap(false);
        await this.robot.robot.updateMap();
    }
}

module.exports = CecotecPersistentMapControlCapability;
