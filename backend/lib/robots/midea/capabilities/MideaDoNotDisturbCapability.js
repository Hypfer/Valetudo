const BEightParser = require("../../../msmart/BEightParser");
const DoNotDisturbCapability = require("../../../core/capabilities/DoNotDisturbCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartDndConfigurationDTO = require("../../../msmart/dtos/MSmartDNDConfigurationDTO");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const ValetudoDNDConfiguration = require("../../../entities/core/ValetudoDNDConfiguration");

/**
 * @extends DoNotDisturbCapability<import("../MideaValetudoRobot")>
 */
class MideaDoNotDisturbCapability extends DoNotDisturbCapability {
    /**
     * @returns {Promise<ValetudoDNDConfiguration>}
     */
    async getDndConfiguration() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.GET_DND)
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
        const payload = Buffer.from([
            dndConfig.enabled ? 1 : 0,
            dndConfig.start.hour,
            dndConfig.start.minute,
            dndConfig.end.hour,
            dndConfig.end.minute
        ]);

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(MSmartConst.SETTING.SET_DND, payload)
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaDoNotDisturbCapability;
