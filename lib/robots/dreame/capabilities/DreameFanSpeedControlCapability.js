const FanSpeedControlCapability = require("../../../core/capabilities/FanSpeedControlCapability");

class DreameFanSpeedControlCapability extends FanSpeedControlCapability {

    /**
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     * @param {Array<import("../../../entities/core/ValetudoIntensityPreset")>} options.presets
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
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async setIntensity(preset) {
        const matchedPreset = this.presets.find(p => p.name === preset);

        if (matchedPreset) {
            const res = await this.robot.sendCommand("set_properties", [
                {
                    did: this.robot.deviceId,
                    siid: this.siid,
                    piid: this.piid,
                    value: matchedPreset.value
                }
            ]);

            if (res?.length === 1) {
                if (res[0].code !== 0) {
                    throw new Error("Error code " + res[0].code);
                }
            } else {
                throw new Error("Received invalid response");
            }
        } else {
            throw new Error("Invalid Preset");
        }
    }

}

module.exports = DreameFanSpeedControlCapability;
