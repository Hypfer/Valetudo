const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

class DreameSpeakerVolumeControlCapability extends SpeakerVolumeControlCapability {

    /**
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     *
     * @param {number} options.siid MIOT Service ID
     * @param {number} options.piid MIOT Property ID
     */
    constructor(options) {
        super(options);

        this.siid = options.siid;
        this.piid = options.piid;
    }


    /**
     * Returns the current voice volume as percentage
     *
     * @returns {Promise<number>}
     */
    async getVolume() {
        const res = await this.robot.sendCommand("get_properties", [
            {
                did: this.robot.deviceId,
                siid: this.siid,
                piid: this.piid
            }
        ]);

        if (Array.isArray(res) && res.length === 1) {
            if (res[0].code === 0) {
                return res[0].value;
            } else {
                throw new Error("Error code " + res[0].code);
            }

        } else {
            throw new Error("Received invalid response");
        }
    }

    /**
     * Sets the speaker volume
     *
     * @param {number} value
     * @returns {Promise<void>}
     */
    async setVolume(value) {
        const res = await this.robot.sendCommand("set_properties", [
            {
                did: this.robot.deviceId,
                siid: this.siid,
                piid: this.piid,
                value: value
            }
        ]);

        if (Array.isArray(res) && res.length === 1) {
            if (res[0].code !== 0) {
                throw new Error("Error code " + res[0].code);
            }
        } else {
            throw new Error("Received invalid response");
        }
    }

}

module.exports = DreameSpeakerVolumeControlCapability;
