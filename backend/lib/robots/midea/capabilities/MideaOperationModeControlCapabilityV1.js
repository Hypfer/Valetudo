const OperationModeControlCapability = require("../../../core/capabilities/OperationModeControlCapability");

const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

/**
 * @extends OperationModeControlCapability<import("../MideaValetudoRobot")>
 */
class MideaOperationModeControlCapabilityV1 extends OperationModeControlCapability {
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
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.SETTING.LEGACY_MULTI,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_ELEVATOR_SWITCH,
                        matchedPreset.value === true ? 0x01 : 0x00
                    ])
                )
            });

            await this.robot.sendCommand(packet.toHexString());

            this.robot.parseAndUpdateState(
                new MSmartStatusDTO({
                    elevator_switch: matchedPreset.value
                })
            );
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = MideaOperationModeControlCapabilityV1;
