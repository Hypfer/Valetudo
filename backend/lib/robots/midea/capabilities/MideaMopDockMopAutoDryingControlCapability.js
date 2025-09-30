const BEightParser = require("../../../msmart/BEightParser");
const MopDockMopAutoDryingControlCapability = require("../../../core/capabilities/MopDockMopAutoDryingControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends MopDockMopAutoDryingControlCapability<import("../MideaValetudoRobot")>
 */
class MideaMopDockMopAutoDryingControlCapability extends MopDockMopAutoDryingControlCapability {

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
            return parsedResponse.mop_auto_dry_switch;
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
                    0x14, // mop auto drying
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
                    0x14, // mop auto drying
                    0x00 // false
                ])
            )
        }).toHexString());
    }
}

module.exports = MideaMopDockMopAutoDryingControlCapability;
