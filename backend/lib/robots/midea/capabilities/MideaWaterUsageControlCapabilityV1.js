const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");
const WaterUsageControlCapability = require("../../../core/capabilities/WaterUsageControlCapability");

const entities = require("../../../entities");

/**
 * @extends WaterUsageControlCapability<import("../MideaValetudoRobot")>
 */
class MideaWaterUsageControlCapabilityV1 extends WaterUsageControlCapability {
    /**
     * @param {string} preset
     * @returns {Promise<void>}
     */
    async selectPreset(preset) {
        const matchedPreset = this.presets.find(p => {
            return p.name === preset;
        });

        if (matchedPreset) {
            const FanSpeedAttribute = this.robot.state.getFirstMatchingAttribute({
                attributeClass: entities.state.attributes.PresetSelectionStateAttribute.name,
                attributeType: entities.state.attributes.PresetSelectionStateAttribute.TYPE.FAN_SPEED
            });

            const fanSpeed = FanSpeedAttribute?.metaData?.rawValue ?? 1;

            const packet = new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.SETTING.LEGACY_MULTI,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_PARAMETERS,
                        fanSpeed,
                        0x00, // unknown - possibly operating mode?
                        matchedPreset.value,
                        0x01
                    ])
                )
            });

            await this.robot.sendCommand(packet.toHexString());

            this.robot.parseAndUpdateState(
                new MSmartStatusDTO({
                    water_level: matchedPreset.value
                })
            );
        } else {
            throw new Error("Invalid Preset");
        }
    }
}

module.exports = MideaWaterUsageControlCapabilityV1;
