const BEightParser = require("../../../msmart/BEightParser");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");
const PetObstacleAvoidanceControlCapability = require("../../../core/capabilities/PetObstacleAvoidanceControlCapability");

/**
 * @extends PetObstacleAvoidanceControlCapability<import("../MideaValetudoRobot")>
 */
class MideaPetObstacleAvoidanceControlCapability extends PetObstacleAvoidanceControlCapability {

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
            return parsedResponse.pet_mode_switch;
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
                    0x0e, // Pet Mode
                    0x01  // true
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
                    0x0e, // Pet mode
                    0x00  // false
                ])
            )
        }).toHexString());
    }
}

module.exports = MideaPetObstacleAvoidanceControlCapability;
