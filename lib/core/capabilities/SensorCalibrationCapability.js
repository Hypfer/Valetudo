const Capability = require("./Capability");
const NotImplementedError = require("../NotImplementedError");

/**
 * @template {import("../ValetudoRobot")} T
 * @extends Capability<T>
 */
class SensorCalibrationCapability extends Capability {
    /**
     * This function returns the sensors that can be calibrated
     *
     * @abstract
     * @returns {Promise<Array<import("../../entities/core/ValetudoSensor")>>}
     */
    async getSensors() {
        throw new NotImplementedError();
    }

    /**
     * This function calibrates one of the sensors available for calibration
     *
     * @abstract
     * @param {string} type
     * @param {string} [subType]
     * @returns {Promise<void>}
     */
    async calibrateSensor(type, subType) {
        throw new NotImplementedError();
    }


    getType() {
        return SensorCalibrationCapability.TYPE;
    }
}

SensorCalibrationCapability.TYPE = "SensorCalibrationCapability";

module.exports = SensorCalibrationCapability;
