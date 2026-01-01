const BEightParser = require("../../../msmart/BEightParser");
const IntensiveMoppingPathControlCapability = require("../../../core/capabilities/IntensiveMoppingPathControlCapability");
const MSmartCleaningSettings1DTO = require("../../../msmart/dtos/MSmartCleaningSettings1DTO");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends IntensiveMoppingPathControlCapability<import("../MideaValetudoRobot")>
 */
class MideaIntensiveMoppingPathControlCapability extends IntensiveMoppingPathControlCapability {

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CLEANING_SETTINGS_1)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartCleaningSettings1DTO) {
            return parsedResponse.route_type === 2;
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_CLEANING_SETTINGS_1,
                Buffer.from([
                    0x00,
                    2 // Deep
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_CLEANING_SETTINGS_1,
                Buffer.from([
                    0x00,
                    1 // Normal
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaIntensiveMoppingPathControlCapability;
