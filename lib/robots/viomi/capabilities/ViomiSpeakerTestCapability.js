const SpeakerTestCapability = require("../../../core/capabilities/SpeakerTestCapability");

class ViomiSpeakerTestCapability extends SpeakerTestCapability {
    /**
     * @returns {Promise<void>}
     */
    async playTestSound() {
        // Viomi doesn't have a specific "test sound" command, so we just make it play the "I'm here" sound
        await this.robot.sendCommand("set_resetpos", [1]);
    }
}

module.exports = ViomiSpeakerTestCapability;
