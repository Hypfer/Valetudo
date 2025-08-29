const Logger = require("../../../Logger");
const SpeakerTestCapability = require("../../../core/capabilities/SpeakerTestCapability");
const {exec} = require("child_process");
const {promisify} = require("util");

const execAsync = promisify(exec);

/**
 * @extends SpeakerTestCapability<import("../MideaValetudoRobot")>
 */
class MideaSpeakerTestCapability extends SpeakerTestCapability {
    /**
     * @returns {Promise<void>}
     */
    async playTestSound() {
        if (this.robot.config.get("embedded") === true) {
            try {
                await execAsync("mp3aplay /oem/sound/2.mp3");
            } catch (err) {
                Logger.warn("Error during speaker test", err);
            }
        } else {
            throw new Error("Only possible when embedded");
        }
    }
}
//TODO: I think I saw a command for this somewhere in some _node

module.exports = MideaSpeakerTestCapability;
