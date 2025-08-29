const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");
const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");


/**
 * @extends WaterUsageControlCapability<import("../MideaValetudoRobot")>
 */
class MideaWaterUsageControlCapability extends WaterUsageControlCapability {
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
                    MSmartConst.SETTING.SET_WATER_GRADE,
                    Buffer.from([matchedPreset.value])
                )
            });

            const response = await this.robot.sendCommand(packet.toHexString());

            if (response?.payload?.[3] === 0x00) {
                this.robot.parseAndUpdateState(
                    new MSmartStatusDTO({
                        water_level: matchedPreset.value
                    })
                );
            } else {
                throw new Error("Water grade change failed");
            }
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = MideaWaterUsageControlCapability;
