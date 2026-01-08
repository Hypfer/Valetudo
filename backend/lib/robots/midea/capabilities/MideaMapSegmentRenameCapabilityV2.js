const BEightParser = require("../../../msmart/BEightParser");
const MapSegmentRenameCapability = require("../../../core/capabilities/MapSegmentRenameCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartMapListDTO = require("../../../msmart/dtos/MSmartMapListDTO");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const {sleep} = require("../../../utils/misc");

/**
 * @extends MapSegmentRenameCapability<import("../MideaValetudoRobot")>
 */
class MideaMapSegmentRenameCapabilityV2 extends MapSegmentRenameCapability {
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
            payload: MSmartPacket.buildPayload(MSmartConst.ACTION.LIST_MAPS)
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
                MSmartConst.SETTING.MAP_MANAGEMENT,
                Buffer.from([
                    0x01,  // load
                    parsedListMapsResponse.currentMapId
                ])
            )
        });

        await this.robot.sendCommand(reloadMapPacket.toHexString());

        await sleep(1_000);
        this.robot.pollMap();
        await sleep(1_000);
    }
}

module.exports = MideaMapSegmentRenameCapabilityV2;
