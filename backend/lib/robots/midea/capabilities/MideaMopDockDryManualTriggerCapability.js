const MopDockDryManualTriggerCapability = require("../../../core/capabilities/MopDockDryManualTriggerCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");

// TODO: this doesn't seem to work?

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
                MSmartConst.SETTING.TRIGGER_STATION_ACTION,
                Buffer.from([
                    0x04, // Drying Mode
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
                MSmartConst.SETTING.TRIGGER_STATION_ACTION,
                Buffer.from([
                    0x00, // Doesn't matter
                    0x00  // Stop
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaMopDockDryManualTriggerCapability;
