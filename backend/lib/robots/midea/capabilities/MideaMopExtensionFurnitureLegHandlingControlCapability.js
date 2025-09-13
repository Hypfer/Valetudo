const BEightParser = require("../../../msmart/BEightParser");
const MopExtensionFurnitureLegHandlingControlCapability = require("../../../core/capabilities/MopExtensionFurnitureLegHandlingControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends MopExtensionFurnitureLegHandlingControlCapability<import("../MideaValetudoRobot")>
 */
class MideaMopExtensionFurnitureLegHandlingControlCapability extends MopExtensionFurnitureLegHandlingControlCapability {

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const response = await this.robot.sendCommand(new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_STATUS)
        }).toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            return parsedResponse.furniture_legs_cleaning_switch;
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        await this.robot.sendCommand(new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x2f, // furniture legs cleaning
                    0x01 // true
                ])
            )
        }).toHexString());
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        await this.robot.sendCommand(new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x2f, // furniture legs cleaning
                    0x00 // false
                ])
            )
        }).toHexString());
    }
}

module.exports = MideaMopExtensionFurnitureLegHandlingControlCapability;
