const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class FanSpeedControlCapability extends Capability {

    /**
     *
     * @param {object} options
     * @param {import("../ValetudoRobot")|any} options.robot
     */
    constructor(options) {
        super(options);
    }

    /**
     * @abstract
     * @returns {Array<string>}
     */
    getFanSpeedPresets() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async setFanSpeedPreset(preset) {
        throw new NotImplementedError();
    }


    getType() {
        return FanSpeedControlCapability.TYPE;
    }
}

FanSpeedControlCapability.TYPE = "FanSpeedControlCapability";

module.exports = FanSpeedControlCapability;