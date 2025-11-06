const AutoEmptyDockManualTriggerCapability = require("../../../core/capabilities/AutoEmptyDockManualTriggerCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends AutoEmptyDockManualTriggerCapability<import("../MideaValetudoRobot")>
 */
class MideaAutoEmptyDockManualTriggerCapabilityV1 extends AutoEmptyDockManualTriggerCapability {
    /**
     * @returns {Promise<void>}
     */
    async triggerAutoEmpty() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.AUTO_EMPTY_DOCK_PARAMETERS,
                    0x01
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaAutoEmptyDockManualTriggerCapabilityV1;
