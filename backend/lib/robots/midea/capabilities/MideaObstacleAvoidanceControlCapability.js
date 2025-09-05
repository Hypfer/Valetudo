const BEightParser = require("../../../msmart/BEightParser");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");
const ObstacleAvoidanceControlCapability = require("../../../core/capabilities/ObstacleAvoidanceControlCapability");

/**
 * @extends ObstacleAvoidanceControlCapability<import("../MideaValetudoRobot")>
 */
class MideaObstacleAvoidanceControlCapability extends ObstacleAvoidanceControlCapability {

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            return parsedResponse.ai_avoidance_switch;
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const statusPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
        });

        const response = await this.robot.sendCommand(statusPacket.toHexString());
        const status = BEightParser.PARSE(response);

        if (!(status instanceof MSmartStatusDTO)) {
            throw new Error("Invalid status response from robot");
        }

        if (status.ai_recognition_switch === false) {
            const tosPacket = new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildPayload(
                    MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                    Buffer.from([
                        0x0f, // AI Recognition (ToS)
                        0x01  // true
                    ])
                )
            });

            await this.robot.sendCommand(tosPacket.toHexString());
        }

        const avoidancePacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x2c, // AI Obstacle Avoidance
                    0x01  // true
                ])
            )
        });

        await this.robot.sendCommand(avoidancePacket.toHexString());
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x2c, // AI Obstacle Avoidance
                    0x00  // false
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaObstacleAvoidanceControlCapability;
