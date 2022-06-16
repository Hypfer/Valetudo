/**
 * A RobotFirmwareError is an error that was sent to us by the robots' firmware.
 * e.g. "segment 17 doesn't exist and therefore cannot be cleaned"
 */
class RobotFirmwareError extends Error {
    constructor(message) {
        super(message);
        this.name = "RobotFirmwareError";
    }
}

module.exports = RobotFirmwareError;
