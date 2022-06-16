const RobotFirmwareError = require("../core/RobotFirmwareError");

class MiioErrorResponseRobotFirmwareError extends RobotFirmwareError {
    constructor(msg, response) {
        super(msg);

        this.name = "MiioErrorResponseRobotFirmwareError";
        this.response = response;
    }
}

module.exports = MiioErrorResponseRobotFirmwareError;
