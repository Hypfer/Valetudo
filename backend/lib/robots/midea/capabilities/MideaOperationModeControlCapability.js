const OperationModeControlCapability = require("../../../core/capabilities/OperationModeControlCapability");

const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");


/**
 * @extends OperationModeControlCapability<import("../MideaValetudoRobot")>
 */
class MideaOperationModeControlCapability extends OperationModeControlCapability {
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
                    MSmartConst.SETTING.SET_OPERATION_MODE,
                    Buffer.from([matchedPreset.value])
                )
            });

            const response = await this.robot.sendCommand(packet.toHexString());

            if (response?.payload?.[3] === 0x00) {
                this.robot.parseAndUpdateState(
                    new MSmartStatusDTO({
                        station_work_status: matchedPreset.value
                    })
                );
            } else {
                throw new Error("Operation mode change failed");
            }
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = MideaOperationModeControlCapability;
