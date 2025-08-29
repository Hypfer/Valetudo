const FanSpeedControlCapability = require("../../../core/capabilities/FanSpeedControlCapability");

const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends FanSpeedControlCapability<import("../MideaValetudoRobot")>
 */
class MideaFanSpeedControlCapability extends FanSpeedControlCapability {
    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => {
            return p.name === preset;
        });

        if (matchedPreset) {
            const packet = new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildPayload(
                    MSmartConst.SETTING.SET_FAN_SPEED,
                    Buffer.from([matchedPreset.value])
                )
            });

            const response = await this.robot.sendCommand(packet.toHexString());

            if (response?.payload?.[3] === 0x00) {
                this.robot.parseAndUpdateState(
                    new MSmartStatusDTO({
                        fan_level: matchedPreset.value
                    })
                );
            } else {
                throw new Error("Fan speed change failed");
            }
        } else {
            throw new Error("Invalid Preset");
        }
    }

}

module.exports = MideaFanSpeedControlCapability;
