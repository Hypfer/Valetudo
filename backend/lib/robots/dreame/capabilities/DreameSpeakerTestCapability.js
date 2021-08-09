const DreameMiotHelper = require("../DreameMiotHelper");
const SpeakerTestCapability = require("../../../core/capabilities/SpeakerTestCapability");

/**
 * @extends SpeakerTestCapability<import("../DreameValetudoRobot")>
 */
class DreameSpeakerTestCapability extends SpeakerTestCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.aiid MIOT Action ID
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.aiid = options.aiid;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }

    /**
     * @returns {Promise<void>}
     */
    async playTestSound() {
        await this.helper.executeAction(this.siid, this.aiid);
    }

}

module.exports = DreameSpeakerTestCapability;
