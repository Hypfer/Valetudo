const BEightParser = require("../../../msmart/BEightParser");
const MappingPassCapability = require("../../../core/capabilities/MappingPassCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartMapListDTO = require("../../../msmart/dtos/MSmartMapListDTO");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends MappingPassCapability<import("../MideaValetudoRobot")>
 */
class MideaMappingPassCapabilityV1 extends MappingPassCapability {
    /**
     * @returns {Promise<void>}
     */
    async startMapping() {
        const listMapsPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_ONE,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_ONE_ACTION_SUBCOMMAND.LIST_MAPS
                ])
            )
        });

        const listMapsResponse = await this.robot.sendCommand(listMapsPacket.toHexString());
        const parsedListMapsResponse = BEightParser.PARSE(listMapsResponse);

        if (!(parsedListMapsResponse instanceof MSmartMapListDTO)) {
            throw new Error("Failed to check for existing map.");
        }

        if (parsedListMapsResponse.savedMapIds.length !== 0) {
            throw new Error("A map already exists.");
        }

        // Prerequisite for the mapping pass.. for some reason? Sending it every time won't hurt
        const enableMultiMapPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_MULTI_MAP,
                    0x01 // on
                ])
            )
        });

        await this.robot.sendCommand(enableMultiMapPacket.toHexString());

        const startMappingPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.START_MAPPING_PASS,
                    0x00,
                    0x01 // only map
                ])
            )
        });

        await this.robot.sendCommand(startMappingPacket.toHexString());
    }
}

module.exports = MideaMappingPassCapabilityV1;
