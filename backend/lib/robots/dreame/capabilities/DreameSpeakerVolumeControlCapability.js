const DreameMiotHelper = require("../DreameMiotHelper");
const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

/**
 * @extends SpeakerVolumeControlCapability<import("../DreameValetudoRobot")>
 */
class DreameSpeakerVolumeControlCapability extends SpeakerVolumeControlCapability {

    /**
     * @param {object} options
     * @param {import("../DreameValetudoRobot")} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.piid MIOT Property ID
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.piid = options.piid;

        this.helper = new DreameMiotHelper({robot: this.robot});
    }


    /**
     * Returns the current voice volume as percentage
     *
     * @returns {Promise<number>}
     */
    async getVolume() {
        return this.helper.readProperty(this.siid, this.piid);
    }

    /**
     * Sets the speaker volume
     *
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setVolume(value) {
        await this.helper.writeProperty(this.siid, this.piid, value);
    }

}

module.exports = DreameSpeakerVolumeControlCapability;
