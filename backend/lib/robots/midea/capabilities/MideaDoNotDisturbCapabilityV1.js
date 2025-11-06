const BEightParser = require("../../../msmart/BEightParser");
const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartDndConfigurationDTO = require("../../../msmart/dtos/MSmartDNDConfigurationDTO");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");

/**
 * @extends DoNotDisturbCapability<import("../MideaValetudoRobot")>
 */
class MideaDoNotDisturbCapabilityV1 extends DoNotDisturbCapability {
    /**
     * @returns {Promise<ValetudoDNDConfiguration>}
     */
    async getDndConfiguration() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_ONE,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_ONE_ACTION_SUBCOMMAND.GET_DND
                ])
            )
        });

        const responsePacket = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(responsePacket);

        if (!(parsedResponse instanceof MSmartDndConfigurationDTO)) {
            throw new Error("Failed to parse DND configuration response.");
        }

        return new ValetudoDNDConfiguration({
            enabled: parsedResponse.enabled,
            start: parsedResponse.start,
            end: parsedResponse.end
        });
    }

    /**
     * 
     * @param {ValetudoDNDConfiguration} dndConfig
     * @returns {Promise<void>}
     */
    async setDndConfiguration(dndConfig) {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_DND,

                    dndConfig.enabled ? 1 : 0,
                    dndConfig.start.hour,
                    dndConfig.start.minute,
                    dndConfig.end.hour,
                    dndConfig.end.minute
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaDoNotDisturbCapabilityV1;
