const BEightParser = require("../../../msmart/BEightParser");
const CarpetModeControlCapability = require("../../../core/capabilities/CarpetModeControlCapability");
const MSmartCarpetBehaviorSettingsDTO = require("../../../msmart/dtos/MSmartCarpetBehaviorSettingsDTO");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");


/**
 * @extends CarpetModeControlCapability<import("../MideaValetudoRobot")>
 */
class MideaCarpetModeControlCapabilityV2 extends CarpetModeControlCapability {
    /**
     * @private
     * @returns {Promise<MSmartCarpetBehaviorSettingsDTO>}
     */
    async _getSettings() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_CARPET_BEHAVIOR_SETTINGS)
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartCarpetBehaviorSettingsDTO) {
            return parsedResponse;
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    /**
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const settings = await this._getSettings();

        return settings.carpet_suction_boost;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const currentSettings = await this._getSettings();
        const newParameterBitfield = currentSettings.parameter_bitfield | MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.CARPET_SUCTION_BOOST;

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_CARPET_BEHAVIOR_SETTINGS,
                Buffer.from([
                    currentSettings.carpet_behavior,
                    newParameterBitfield
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const currentSettings = await this._getSettings();
        const newParameterBitfield = currentSettings.parameter_bitfield & ~MSmartCarpetBehaviorSettingsDTO.PARAMETER_BIT.CARPET_SUCTION_BOOST;

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_CARPET_BEHAVIOR_SETTINGS,
                Buffer.from([
                    currentSettings.carpet_behavior,
                    newParameterBitfield
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaCarpetModeControlCapabilityV2;
