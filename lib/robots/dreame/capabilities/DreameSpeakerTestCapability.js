const SpeakerTestCapability = require("../../../core/capabilities/SpeakerTestCapability");

class DreameSpeakerTestCapability extends SpeakerTestCapability {

    /**
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.aiid MIOT Action ID
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.aiid = options.aiid;
    }

    /**
     * @returns {Promise<void>}
     */
    async playTestSound() {
        const res = await this.robot.sendCommand("action", {
            did: this.robot.deviceId,
            siid: this.siid,
            aiid: this.aiid
        });

        if (res.code !== 0) {
            throw new Error("Error code " + res.code);
        }
    }

}

module.exports = DreameSpeakerTestCapability;
