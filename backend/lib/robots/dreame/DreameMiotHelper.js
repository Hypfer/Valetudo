const RobotFirmwareError = require("../../core/RobotFirmwareError");
const {sleep} = require("../../utils/misc");

class DreameMiotHelper {
    /**
     * @param {object} options
     * @param {import("./DreameValetudoRobot")} options.robot
     * @param {number} [options.postWriteDelay]
     */
    constructor(options) {
        this.robot = options.robot;
        this.postWriteDelay = options.postWriteDelay ?? null;
    }

    /**
     * @param {Array<{siid: number, piid: number}>} properties
     * @returns {Promise<Array<*>>}
     */
    async readProperties(properties) {
        const res = await this.robot.sendCommand("get_properties", properties.map(p => {
            return {
                did: this.robot.deviceId,
                siid: p.siid,
                piid: p.piid
            };
        }));

        if (res && res.length === properties.length) {
            return res;
        } else {
            throw new Error("Received invalid response");
        }
    }

    /**
     * @param {number} siid
     * @param {number} piid
     * @returns {Promise<*>}
     */
    async readProperty(siid, piid) {
        const res = await this.readProperties([{ siid: siid, piid: piid }]);

        if (res[0].code === 0) {
            return res[0].value;
        } else {
            throw new RobotFirmwareError("Error code " + res[0].code);
        }
    }

    /**
     * @param {Array<{siid: number, piid: number, value: *}>} properties
     * @param {object} [options]
     * @param {number|null} [options.postWriteDelay]
     * @returns {Promise<void>}
     */
    async writeProperties(properties, options) {
        const postWriteDelay = options?.postWriteDelay ?? this.postWriteDelay;
        const res = await this.robot.sendCommand("set_properties", properties.map(p => {
            return {
                did: this.robot.deviceId,
                siid: p.siid,
                piid: p.piid,
                value: p.value
            };
        }));

        if (res && res.length === properties.length) {
            const errorItem = res.find(r => r.code !== 0);
            if (errorItem) {
                throw new RobotFirmwareError("Error code " + errorItem.code);
            }

            if (postWriteDelay) {
                await sleep(postWriteDelay); // Give the firmware some time to think
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
     * @param {object} [options]
     * @param {number|null} [options.postWriteDelay]
     * @returns {Promise<void>}
     */
    async writeProperty(siid, piid, value, options) {
        await this.writeProperties([
            {
                siid: siid,
                piid: piid,
                value: value
            }
        ], options);
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
