const BEightParser = require("../../../msmart/BEightParser");
const MapSegmentRenameCapability = require("../../../core/capabilities/MapSegmentRenameCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartMapListDTO = require("../../../msmart/dtos/MSmartMapListDTO");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MapSegmentRenameCapability<import("../MideaValetudoRobot")>
 */
class MideaMapSegmentRenameCapabilityV1 extends MapSegmentRenameCapability {
    /**
     * @param {object} options
     * @param {import("../MideaValetudoRobot")} options.robot
     * @param {import("../MideaMapHacksProvider")} options.mapHacksProvider
     */
    constructor(options) {
        super(options);

        this.mapHacksProvider = options.mapHacksProvider;
    }

    async renameSegment(segment, name) {
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

        this.mapHacksProvider.setName(segment.id, name);

        const reloadMapPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.MAP_MANAGEMENT,
                    0x01,  // load
                    parsedListMapsResponse.currentMapId
                ])
            )
        });

        try {
            await this.robot.sendCommand(reloadMapPacket.toHexString(), {timeout: 7000});
        } catch (e) {
            /* This seems to just time out sometimes? All the time? Whatever. We shall ignore it */
        }

        await sleep(2_000);
        this.robot.pollMap();
        await sleep(2_500);
    }
}

module.exports = MideaMapSegmentRenameCapabilityV1;
