const Logger = require("../../../Logger");
const SpeakerTestCapability = require("../../../core/capabilities/SpeakerTestCapability");

/**
 * @extends SpeakerTestCapability<import("../MockValetudoRobot")>
 */
class MockSpeakerTestCapability extends SpeakerTestCapability {
    /**
     * @returns {Promise<void>}
     */
    async playTestSound() {
        const volume = await this.robot.capabilities["SpeakerVolumeControlCapability"].getVolume();
        Logger.info("Playing test sound at " + volume + " % volume");
    }
}

module.exports = MockSpeakerTestCapability;
