const AutoEmptyDockManualTriggerCapability = require("../../../core/capabilities/AutoEmptyDockManualTriggerCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends AutoEmptyDockManualTriggerCapability<import("../MideaValetudoRobot")>
 */
class MideaAutoEmptyDockManualTriggerCapability extends AutoEmptyDockManualTriggerCapability {
    /**
     * @returns {Promise<void>}
     */
    async triggerAutoEmpty() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.TRIGGER_STATION_ACTION,
                Buffer.from([
                    0x02, // Mode: Dust Collection
                    0x01  // Start
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaAutoEmptyDockManualTriggerCapability;
