const MopDockDryManualTriggerCapability = require("../../../core/capabilities/MopDockDryManualTriggerCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends MopDockDryManualTriggerCapability<import("../MideaValetudoRobot")>
 */
class MideaMopDockDryManualTriggerCapability extends MopDockDryManualTriggerCapability {
    /**
     * @returns {Promise<void>}
     */
    async startDrying() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.TRIGGER_MOP_DRYING_ACTION,
                Buffer.from([
                    0x01  // Start
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @returns {Promise<void>}
     */
    async stopDrying() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.TRIGGER_MOP_DRYING_ACTION,
                Buffer.from([
                    0x00  // Stop
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaMopDockDryManualTriggerCapability;
