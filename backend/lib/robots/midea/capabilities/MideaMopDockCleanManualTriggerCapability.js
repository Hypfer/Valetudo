const MopDockCleanManualTriggerCapability = require("../../../core/capabilities/MopDockCleanManualTriggerCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends MopDockCleanManualTriggerCapability<import("../MideaValetudoRobot")>
 */
class MideaMopDockCleanManualTriggerCapability extends MopDockCleanManualTriggerCapability {
    /**
     * @returns {Promise<void>}
     */
    async startCleaning() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.TRIGGER_STATION_ACTION,
                Buffer.from([
                    0x01, // Mode: Mop Clean (basic) - TODO: there is also 0x03 for station cleaning
                    0x01  // Control: Start
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @returns {Promise<void>}
     */
    async stopCleaning() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.TRIGGER_STATION_ACTION,
                Buffer.from([
                    0x00, // Mode: Ignored when stopping
                    0x00  // Control: Stop
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaMopDockCleanManualTriggerCapability;
