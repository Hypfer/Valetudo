const SpotCleaningCapability = require("../../../core/capabilities/SpotCleaningCapability");

class RoborockSpotCleaningCapability extends SpotCleaningCapability {
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    async spotClean() {
        await this.robot.sendCommand("app_spot", [], {});
    }
}

module.exports = RoborockSpotCleaningCapability;