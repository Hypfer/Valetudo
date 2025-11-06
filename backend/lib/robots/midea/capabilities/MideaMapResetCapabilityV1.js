const BEightParser = require("../../../msmart/BEightParser");
const MapResetCapability = require("../../../core/capabilities/MapResetCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartMapListDTO = require("../../../msmart/dtos/MSmartMapListDTO");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MapResetCapability<import("../MideaValetudoRobot")>
 */
class MideaMapResetCapabilityV1 extends MapResetCapability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
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
            throw new Error("Failed to list map ids.");
        }

        const idsToDelete = new Set([...parsedListMapsResponse.savedMapIds, parsedListMapsResponse.currentMapId]);
        for (const mapId of idsToDelete) {
            const mapDeletePacket = new MSmartPacket({
                messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
                payload: MSmartPacket.buildLegacyPayload(
                    MSmartConst.SETTING.LEGACY_MULTI,
                    Buffer.from([
                        MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.MAP_MANAGEMENT,
                        0x02,  // delete
                        mapId
                    ])
                )
            });

            await this.robot.sendCommand(mapDeletePacket.toHexString());
        }

        const setMapIndexPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_VALID_MAP_IDS,
                    0x04, // no clue why
                    0b00000000 // bitset of all map IDs the cloud is aware of
                ])
            )
        });
        await this.robot.sendCommand(setMapIndexPacket.toHexString());
        await sleep(4_000); // for good measure

        this.robot.clearValetudoMap();
    }
}

module.exports = MideaMapResetCapabilityV1;
