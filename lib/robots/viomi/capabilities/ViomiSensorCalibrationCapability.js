const SensorCalibrationCapability = require("../../../core/capabilities/SensorCalibrationCapability");
const ValetudoSensor = require("../../../entities/core/ValetudoSensor");

class ViomiSensorCalibrationCapability extends SensorCalibrationCapability {

    /**
     * @param {object} options
     * @param {import("../../../core/ValetudoRobot")|any} options.robot
     * @param {readonly import("../../../entities/core/ValetudoSensor")[]} options.sensors
     */
    constructor(options) {
        super(options);
        this.sensors = options.sensors;
    }

    /**
     * This function returns the sensors that can be calibrated
     *
     * @abstract
     * @returns {Promise<readonly import("../../../entities/core/ValetudoSensor")[]>}
     */
    async getSensors() {
        return this.sensors;
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
        if (type !== ValetudoSensor.TYPE.ACCELEROMETER && subType !== null) {
            throw new Error("Only the accelerometer can be calibrated");
        }
        await this.robot.sendCommand("set_calibration", [1], {timeout: 5000});
    }
}

module.exports = ViomiSensorCalibrationCapability;