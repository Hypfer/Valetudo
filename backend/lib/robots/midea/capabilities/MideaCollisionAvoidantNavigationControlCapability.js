const BEightParser = require("../../../msmart/BEightParser");
const CollisionAvoidantNavigationControlCapability = require("../../../core/capabilities/CollisionAvoidantNavigationControlCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends CollisionAvoidantNavigationControlCapability<import("../MideaValetudoRobot")>
 */
class MideaCollisionAvoidantNavigationControlCapability extends CollisionAvoidantNavigationControlCapability {

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
            return parsedResponse.edge_deep_vacuum_switch;
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
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x31, // Edge Deep
                    0x01 // true
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
                MSmartConst.SETTING.SET_VARIOUS_TOGGLES,
                Buffer.from([
                    0x31, // Edge Deep
                    0x00 // false
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaCollisionAvoidantNavigationControlCapability;
