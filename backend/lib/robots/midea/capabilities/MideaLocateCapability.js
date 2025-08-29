const LocateCapability = require("../../../core/capabilities/LocateCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends LocateCapability<import("../MideaValetudoRobot")>
 */
class MideaLocateCapability extends LocateCapability {
    /**
     * @returns {Promise<void>}
     */
    async locate() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.LOCATE)
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaLocateCapability;
