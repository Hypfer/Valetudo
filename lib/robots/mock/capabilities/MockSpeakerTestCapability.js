const Logger = require("../../../Logger");
const SpeakerTestCapability = require("../../../core/capabilities/SpeakerTestCapability");

/**
 * @extends SpeakerTestCapability<import("../MockRobot")>
 */
class MockSpeakerTestCapability extends SpeakerTestCapability {
    constructor(options) {
        super(options);
    }

    /**
     * @returns {Promise<void>}
     */
    async playTestSound() {
        const volume = await this.robot.capabilities["SpeakerVolumeControlCapability"].getVolume();
        Logger.info("Playing test sound at " + volume + " % volume");
    }
}

module.exports = MockSpeakerTestCapability;
