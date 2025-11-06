const LocateCapability = require("../../../core/capabilities/LocateCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends LocateCapability<import("../MideaValetudoRobot")>
 */
class MideaLocateCapabilityV1 extends LocateCapability {
    /**
     * @returns {Promise<void>}
     */
    async locate() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_TWO,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_TWO_ACTION_SUBCOMMAND.LOCATE,
                    0x00, 0x00, 0x00, 0x00, 0x00
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaLocateCapabilityV1;
