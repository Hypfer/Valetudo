const RobotFirmwareError = require("../../core/RobotFirmwareError");

class DreameMiotHelper {
    /**
     * @param {object} options
     * @param {import("./DreameValetudoRobot")} options.robot
     */
    constructor(options) {
        this.robot = options.robot;
    }

    /**
     * @param {number} siid
     * @param {number} piid
     * @returns {Promise<*>}
     */
    async readProperty(siid, piid) {
        const res = await this.robot.sendCommand("get_properties", [
            {
                did: this.robot.deviceId,
                siid: siid,
                piid: piid
            }
        ]);

        if (res?.length === 1) {
            if (res[0].code === 0) {
                return res[0].value;
            } else {
                throw new RobotFirmwareError("Error code " + res[0].code);
            }

        } else {
            throw new Error("Received invalid response");
        }
    }

    /**
     *
     * @param {number} siid
     * @param {number} piid
     * @param {*} value
     * @returns {Promise<void>}
     */
    async writeProperty(siid, piid, value) {
        const res = await this.robot.sendCommand("set_properties", [
            {
                did: this.robot.deviceId,
                siid: siid,
                piid: piid,
                value: value
            }
        ]);

        if (res?.length === 1) {
            if (res[0].code !== 0) {
                throw new RobotFirmwareError("Error code " + res[0].code);
            }
        } else {
            throw new Error("Received invalid response");
        }
    }

    /**
     *
     * @param {number} siid
     * @param {number} aiid
     * @param {Array<*>} [additionalParameters]
     * @returns {Promise<void>}
     */
    async executeAction(siid, aiid, additionalParameters) {
        const res = await this.robot.sendCommand("action", {
            did: this.robot.deviceId,
            siid: siid,
            aiid: aiid,
            in: additionalParameters ?? []
        });

        if (res.code !== 0) {
            throw new RobotFirmwareError("Error code " + res.code);
        }
    }
}

module.exports = DreameMiotHelper;
