const MapResetCapability = require("../../../core/capabilities/MapResetCapability");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const {sleep} = require("../../../utils/misc");

// After sending the bitset, the firmware will notice that it has maps the cloud doesn't know about, and,
// if more than 5 minutes have passed since the last map upload, it will delete all of those.

// As that condition is not useful when using valetudo, we need to patch out that 5 minute check
// It is found in CCentralController::SetMapHouseIDSet in manager_node

/**
 * @extends MapResetCapability<import("../MideaValetudoRobot")>
 */
class MideaMapResetCapability extends MapResetCapability {
    /**
     * @returns {Promise<void>}
     */
    async reset() {
        const setMapIndexPacket = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildPayload(
                MSmartConst.SETTING.SET_VALID_MAP_IDS,
                Buffer.from([0b00000000000000000000000000000000]) // bitset of all map IDs the cloud is aware of
            )
        });
        await this.robot.sendCommand(setMapIndexPacket.toHexString());
        await sleep(4_000); // for good measure

        this.robot.clearValetudoMap();
    }
}

module.exports = MideaMapResetCapability;
