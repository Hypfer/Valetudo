const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class FanSpeedControlCapability extends Capability {

    /**
     *
     * @param options {object}
     * @param options.robot {import("../ValetudoRobot")|any}
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
     * @param preset {string}
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