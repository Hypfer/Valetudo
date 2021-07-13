const SpeakerTestCapability = require("../../../core/capabilities/SpeakerTestCapability");

/**
 * @extends SpeakerTestCapability<import("../CecotecCongaRobot")>
 */
class CecotecSpeakerTestCapability extends SpeakerTestCapability {
    /**
     * @returns {Promise<void>}
     */
    async playTestSound() {
        if (!this.robot.robot) {
            throw new Error("There is no robot connected to server");
        }

        await this.robot.robot.locate();
    }
}

module.exports = CecotecSpeakerTestCapability;
