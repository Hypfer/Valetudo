const BEightParser = require("../../../msmart/BEightParser");
const MappingPassCapability = require("../../../core/capabilities/MappingPassCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartMapListDTO = require("../../../msmart/dtos/MSmartMapListDTO");
const MSmartPacket = require("../../../msmart/MSmartPacket");

/**
 * @extends MappingPassCapability<import("../MideaValetudoRobot")>
 */
class MideaMappingPassCapability extends MappingPassCapability {
    /**
     * @returns {Promise<void>}
     */
    async startMapping() {
        const listMapsPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.LIST_MAPS)
        });

        const listMapsResponse = await this.robot.sendCommand(listMapsPacket.toHexString());
        const parsedListMapsResponse = BEightParser.PARSE(listMapsResponse);

        if (!(parsedListMapsResponse instanceof MSmartMapListDTO)) {
            throw new Error("Failed to check for existing map.");
        }

        if (parsedListMapsResponse.currentMapId !== 0) {
            throw new Error("A map already exists.");
        }

        const startMappingPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_WORK_STATUS,
                Buffer.from([10])
            )
        });

        await this.robot.sendCommand(startMappingPacket.toHexString());
    }
}

module.exports = MideaMappingPassCapability;
