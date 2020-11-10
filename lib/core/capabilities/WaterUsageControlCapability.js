const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

class WaterUsageControlCapability extends Capability {

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
    getWaterUsagePresets() {
        throw new NotImplementedError();
    }

    /**
     * @abstract
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async setWaterUsagePreset(preset) {
        throw new NotImplementedError();
    }


    getType() {
        return WaterUsageControlCapability.TYPE;
    }
}

WaterUsageControlCapability.TYPE = "WaterUsageControlCapability";

module.exports = WaterUsageControlCapability;