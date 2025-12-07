const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const PersistentMapControlCapability = require("../../../core/capabilities/PersistentMapControlCapability");

/**
 * @extends PersistentMapControlCapability<import("../MideaValetudoRobot")>
 */
class MideaPersistentMapControlCapabilityV1 extends PersistentMapControlCapability {

    /**
     *
     * @returns {Promise<boolean>}
     */
    async isEnabled() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_TWO,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_TWO_ACTION_SUBCOMMAND.GET_PERSISTENT_MAPS_TOGGLE
                ])
            )
        });

        const response = await this.robot.sendCommand(packet.toHexString());

        return response.payload[2] === 1;
    }

    /**
     * @returns {Promise<void>}
     */
    async enable() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_PERSISTENT_MAPS_TOGGLE,
                    0x01 // true
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }

    /**
     * @returns {Promise<void>}
     */
    async disable() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_PERSISTENT_MAPS_TOGGLE,
                    0x00 // false
                ])
            )
        });

        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaPersistentMapControlCapabilityV1;
