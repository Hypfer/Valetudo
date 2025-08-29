const AutoEmptyDockAutoEmptyControlCapability = require("../../../core/capabilities/AutoEmptyDockAutoEmptyControlCapability");
const BEightParser = require("../../../msmart/BEightParser");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends AutoEmptyDockAutoEmptyControlCapability<import("../MideaValetudoRobot")>
 */
class MideaAutoEmptyDockAutoEmptyControlCapability extends AutoEmptyDockAutoEmptyControlCapability {

    /**
     *
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
            return parsedResponse.dustTimes >= 1; // could also be every 3 or every 5, but not supported 
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
                MSmartConst.SETTING.SET_DOCK_INTERVALS,
                Buffer.from([
                    0x01, // Auto-empty
                    0x01 // Every 1 cleanup
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
                MSmartConst.SETTING.SET_DOCK_INTERVALS,
                Buffer.from([
                    0x01, // Auto-empty
                    0x00 // Disabled
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaAutoEmptyDockAutoEmptyControlCapability;
