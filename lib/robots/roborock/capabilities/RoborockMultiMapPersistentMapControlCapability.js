const RoborockPersistentMapControlCapability = require("./RoborockPersistentMapControlCapability");

class RoborockMultiMapPersistentMapControlCapability extends RoborockPersistentMapControlCapability {
    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand("set_lab_status", [{lab_status: 1}], {});
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand("set_lab_status", [{lab_status: 0}], {});
    }
}

module.exports = RoborockMultiMapPersistentMapControlCapability;