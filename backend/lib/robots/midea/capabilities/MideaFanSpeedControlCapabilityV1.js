const FanSpeedControlCapability = require("../../../core/capabilities/FanSpeedControlCapability");

const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");

const entities = require("../../../entities");

/**
 * @extends FanSpeedControlCapability<import("../MideaValetudoRobot")>
 */
class MideaFanSpeedControlCapabilityV1 extends FanSpeedControlCapability {
    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => {
            return p.name === preset;
        });

        if (matchedPreset) {
            const WaterGradeAttribute = this.robot.state.getFirstMatchingAttribute({
                attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
                attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.WATER_GRADE
            });

            const waterGrade = WaterGradeAttribute?.metaData?.rawValue ?? 1;


            const packet = new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.SETTING.LEGACY_MULTI,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_PARAMETERS,
                        matchedPreset.value,
                        0x00, // unknown - possibly operating mode?
                        waterGrade,
                        0x01
                    ])
                )
            });

            await this.robot.sendCommand(packet.toHexString());

            this.robot.parseAndUpdateState(
                new MSmartStatusDTO({
                    fan_level: matchedPreset.value
                })
            );
        } else {
            throw new Error("Invalid Preset");
        }
    }

}

module.exports = MideaFanSpeedControlCapabilityV1;
