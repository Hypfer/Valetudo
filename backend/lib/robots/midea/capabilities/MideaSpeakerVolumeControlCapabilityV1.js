const BEightParser = require("../../../msmart/BEightParser");
const MSmartConst = require("../../../msmart/MSmartConst");
const MSmartPacket = require("../../../msmart/MSmartPacket");
const MSmartStatusDTO = require("../../../msmart/dtos/MSmartStatusDTO");
const SpeakerVolumeControlCapability = require("../../../core/capabilities/SpeakerVolumeControlCapability");

/**
 * @extends SpeakerVolumeControlCapability<import("../MideaValetudoRobot")>
 */
class MideaSpeakerVolumeControlCapabilityV1 extends SpeakerVolumeControlCapability {

    /**
     * Returns the current voice volume as percentage
     *
     * @returns {Promise<number>}
     */
    async getVolume() {
        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.ACTION,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.ACTION.LEGACY_MULTI_ONE,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_ONE_ACTION_SUBCOMMAND.POLL_STATUS
                ])
            )
        });

        const response = await this.robot.sendCommand(packet.toHexString());
        const parsedResponse = BEightParser.PARSE(response);

        if (parsedResponse instanceof MSmartStatusDTO) {
            return parsedResponse.voice_level ?? 0;
        } else {
            throw new Error("Invalid response from robot");
        }
    }

    /**
     * Sets the speaker volume
     *
     * @param {number} value - Volume level (0-100)
     * @returns {Promise<void>}
     */
    async setVolume(value) {
        // TODO: validate 0-100?

        const packet = new MSmartPacket({
            messageType: MSmartPacket.MESSAGE_TYPE.SETTING,
            payload: MSmartPacket.buildLegacyPayload(
                MSmartConst.SETTING.LEGACY_MULTI,
                Buffer.from([
                    MSmartConst.LEGACY_MULTI_SETTING_SUBCOMMAND.SET_VOLUME,
                    value,
                ])
            )
        });


        await this.robot.sendCommand(packet.toHexString());
    }
}

module.exports = MideaSpeakerVolumeControlCapabilityV1;
